import os
from os.path import join as pjoin

from jupyter_client.utils import ensure_async
from jupyter_core.application import base_aliases
from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.extension.handler import (
    ExtensionHandlerJinjaMixin,
    ExtensionHandlerMixin,
)
from jupyter_server.serverapp import flags
from jupyter_server.utils import url_escape, url_is_absolute
from jupyter_server.utils import url_path_join as ujoin
from jupyterlab.commands import get_app_dir, get_user_settings_dir, get_workspaces_dir
from jupyterlab_server import LabServerApp
from jupyterlab_server.config import LabConfig, get_page_config, recursive_update
from jupyterlab_server.handlers import _camelCase, is_url
from notebook_shim.shim import NotebookConfigShimMixin
from tornado import web
from traitlets import Bool, default

from ._version import __version__

HERE = os.path.dirname(__file__)

app_dir = get_app_dir()
version = __version__


class NotebookBaseHandler(ExtensionHandlerJinjaMixin, ExtensionHandlerMixin, JupyterHandler):
    def get_page_config(self):
        config = LabConfig()
        app = self.extensionapp
        base_url = self.settings.get("base_url")
        page_config_data = self.settings.setdefault("page_config_data", {})
        page_config = {
            **page_config_data,
            "appVersion": version,
            "baseUrl": self.base_url,
            "terminalsAvailable": self.settings.get("terminals_available", False),
            "token": self.settings["token"],
            "fullStaticUrl": ujoin(self.base_url, "static", self.name),
            "frontendUrl": ujoin(self.base_url, "/"),
            "exposeAppInBrowser": app.expose_app_in_browser,
            "collaborative": app.collaborative,
        }

        if "hub_prefix" in app.serverapp.tornado_settings:
            tornado_settings = app.serverapp.tornado_settings
            hub_prefix = tornado_settings["hub_prefix"]
            page_config["hubPrefix"] = hub_prefix
            page_config["hubHost"] = tornado_settings["hub_host"]
            page_config["hubUser"] = tornado_settings["user"]
            page_config["shareUrl"] = ujoin(hub_prefix, "user-redirect")
            # Assume the server_name property indicates running JupyterHub 1.0.
            if hasattr(app.serverapp, "server_name"):
                page_config["hubServerName"] = app.serverapp.server_name
            api_token = os.getenv("JUPYTERHUB_API_TOKEN", "")
            page_config["token"] = api_token

        server_root = self.settings.get("server_root_dir", "")
        server_root = server_root.replace(os.sep, "/")
        server_root = os.path.normpath(os.path.expanduser(server_root))
        try:
            # Remove the server_root from pref dir
            if self.serverapp.preferred_dir != server_root:
                page_config["preferredPath"] = "/" + os.path.relpath(
                    self.serverapp.preferred_dir, server_root
                )
            else:
                page_config["preferredPath"] = "/"
        except Exception:
            page_config["preferredPath"] = "/"

        mathjax_config = self.settings.get("mathjax_config", "TeX-AMS_HTML-full,Safe")
        # TODO Remove CDN usage.
        mathjax_url = self.settings.get(
            "mathjax_url",
            "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js",
        )
        if not url_is_absolute(mathjax_url) and not mathjax_url.startswith(self.base_url):
            mathjax_url = ujoin(self.base_url, mathjax_url)

        page_config.setdefault("mathjaxConfig", mathjax_config)
        page_config.setdefault("fullMathjaxUrl", mathjax_url)

        # Put all our config in page_config
        for name in config.trait_names():
            page_config[_camelCase(name)] = getattr(app, name)

        # Add full versions of all the urls
        for name in config.trait_names():
            if not name.endswith("_url"):
                continue
            full_name = _camelCase("full_" + name)
            full_url = getattr(app, name)
            if not is_url(full_url):
                # Relative URL will be prefixed with base_url
                full_url = ujoin(base_url, full_url)
            page_config[full_name] = full_url

        labextensions_path = app.extra_labextensions_path + app.labextensions_path
        recursive_update(
            page_config,
            get_page_config(
                labextensions_path,
                logger=self.log,
            ),
        )
        return page_config


class RedirectHandler(NotebookBaseHandler):
    @web.authenticated
    def get(self):
        return self.redirect(self.base_url + "tree")


class TreeHandler(NotebookBaseHandler):
    @web.authenticated
    async def get(self, path=None):
        """
        Display appropriate page for given path.

        - A directory listing is shown if path is a directory
        - Redirected to notebook page if path is a notebook
        - Render the raw file if path is any other file
        """
        path = path.strip("/")
        cm = self.contents_manager

        if await ensure_async(cm.dir_exists(path=path)):
            if await ensure_async(cm.is_hidden(path)) and not cm.allow_hidden:
                self.log.info("Refusing to serve hidden directory, via 404 Error")
                raise web.HTTPError(404)

            # Set treePath for routing to the directory
            page_config = self.get_page_config()
            page_config["treePath"] = path

            tpl = self.render_template("tree.html", page_config=page_config)
            return self.write(tpl)
        elif await ensure_async(cm.file_exists(path)):
            # it's not a directory, we have redirecting to do
            model = await ensure_async(cm.get(path, content=False))
            if model["type"] == "notebook":
                url = ujoin(self.base_url, "notebooks", url_escape(path))
            else:
                # Return raw content if file is not a notebook
                url = ujoin(self.base_url, "files", url_escape(path))
            self.log.debug("Redirecting %s to %s", self.request.path, url)
            self.redirect(url)
        else:
            raise web.HTTPError(404)


class ConsoleHandler(NotebookBaseHandler):
    @web.authenticated
    def get(self, path=None):
        tpl = self.render_template("consoles.html", page_config=self.get_page_config())
        return self.write(tpl)


class TerminalHandler(NotebookBaseHandler):
    @web.authenticated
    def get(self, path=None):
        tpl = self.render_template("terminals.html", page_config=self.get_page_config())
        return self.write(tpl)


class FileHandler(NotebookBaseHandler):
    @web.authenticated
    def get(self, path=None):
        tpl = self.render_template("edit.html", page_config=self.get_page_config())
        return self.write(tpl)


class NotebookHandler(NotebookBaseHandler):
    @web.authenticated
    def get(self, path=None):
        tpl = self.render_template("notebooks.html", page_config=self.get_page_config())
        return self.write(tpl)


aliases = dict(base_aliases)


class JupyterNotebookApp(NotebookConfigShimMixin, LabServerApp):
    name = "notebook"
    app_name = "Jupyter Notebook"
    description = "Jupyter Notebook - A web-based notebook environment for interactive computing"
    version = version
    app_version = version
    extension_url = "/"
    default_url = "/tree"
    file_url_prefix = "/notebooks"
    load_other_extensions = True
    app_dir = app_dir
    subcommands = {}

    expose_app_in_browser = Bool(
        False,
        config=True,
        help="Whether to expose the global app instance to browser via window.jupyterapp",
    )

    collaborative = Bool(False, config=True, help="Whether to enable collaborative mode.")

    flags = flags
    flags["expose-app-in-browser"] = (
        {"JupyterNotebookApp": {"expose_app_in_browser": True}},
        "Expose the global app instance to browser via window.jupyterlab.",
    )
    flags["collaborative"] = (
        {"JupyterNotebookApp": {"collaborative": True}},
        "Whether to enable collaborative mode.",
    )

    @default("static_dir")
    def _default_static_dir(self):
        return os.path.join(HERE, "static")

    @default("templates_dir")
    def _default_templates_dir(self):
        return os.path.join(HERE, "templates")

    @default("app_settings_dir")
    def _default_app_settings_dir(self):
        return pjoin(app_dir, "settings")

    @default("schemas_dir")
    def _default_schemas_dir(self):
        return pjoin(app_dir, "schemas")

    @default("themes_dir")
    def _default_themes_dir(self):
        return pjoin(app_dir, "themes")

    @default("user_settings_dir")
    def _default_user_settings_dir(self):
        return get_user_settings_dir()

    @default("workspaces_dir")
    def _default_workspaces_dir(self):
        return get_workspaces_dir()

    def initialize_handlers(self):
        self.handlers.append(
            (
                rf"/{self.file_url_prefix}/((?!.*\.ipynb($|\?)).*)",
                web.RedirectHandler,
                {"url": "/edit/{0}"},
            )
        )
        self.handlers.append(("/?", RedirectHandler))
        self.handlers.append(("/tree(.*)", TreeHandler))
        self.handlers.append(("/notebooks(.*)", NotebookHandler))
        self.handlers.append(("/edit(.*)", FileHandler))
        self.handlers.append(("/consoles/(.*)", ConsoleHandler))
        self.handlers.append(("/terminals/(.*)", TerminalHandler))
        super().initialize_handlers()

    def initialize_settings(self):
        super().initialize_settings()

    def initialize(self, argv=None):
        """Subclass because the ExtensionApp.initialize() method does not take arguments"""
        super().initialize()


main = launch_new_instance = JupyterNotebookApp.launch_instance

if __name__ == "__main__":
    main()
