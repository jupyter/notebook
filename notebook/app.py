"""Jupyter notebook application."""
import os
import re
from os.path import join as pjoin

from jupyter_client.utils import ensure_async
from jupyter_core.application import base_aliases
from jupyter_core.paths import jupyter_config_dir
from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.extension.handler import (
    ExtensionHandlerJinjaMixin,
    ExtensionHandlerMixin,
)
from jupyter_server.serverapp import flags
from jupyter_server.utils import url_escape, url_is_absolute
from jupyter_server.utils import url_path_join as ujoin
from jupyterlab.commands import (  # type:ignore
    get_app_dir,
    get_user_settings_dir,
    get_workspaces_dir,
)
from jupyterlab_server import LabServerApp
from jupyterlab_server.config import LabConfig, get_page_config, recursive_update
from jupyterlab_server.handlers import _camelCase, is_url
from notebook_shim.shim import NotebookConfigShimMixin  # type:ignore
from tornado import web
from traitlets import Bool, Unicode, default

from ._version import __version__

HERE = os.path.dirname(__file__)

app_dir = get_app_dir()
version = __version__


class NotebookBaseHandler(ExtensionHandlerJinjaMixin, ExtensionHandlerMixin, JupyterHandler):
    """The base notebook API handler."""

    @property
    def custom_css(self):
        return self.settings.get("custom_css", True)

    def get_page_config(self):
        """Get the page config."""
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
        }

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
        page_config.setdefault("jupyterConfigDir", jupyter_config_dir())

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
    """A redirect handler."""

    @web.authenticated
    def get(self):
        """Get the redirect url."""
        return self.redirect(self.base_url + "tree")


class TreeHandler(NotebookBaseHandler):
    """A tree page handler."""

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
    """A console page handler."""

    @web.authenticated
    def get(self, path=None):
        """Get the console page."""
        tpl = self.render_template("consoles.html", page_config=self.get_page_config())
        return self.write(tpl)


class TerminalHandler(NotebookBaseHandler):
    """A terminal page handler."""

    @web.authenticated
    def get(self, path=None):
        """Get the terminal page."""
        tpl = self.render_template("terminals.html", page_config=self.get_page_config())
        return self.write(tpl)


class FileHandler(NotebookBaseHandler):
    """A file page handler."""

    @web.authenticated
    def get(self, path=None):
        """Get the file page."""
        tpl = self.render_template("edit.html", page_config=self.get_page_config())
        return self.write(tpl)


class NotebookHandler(NotebookBaseHandler):
    """A notebook page handler."""

    @web.authenticated
    def get(self, path=None):
        """Get the notebook page."""
        tpl = self.render_template("notebooks.html", page_config=self.get_page_config())
        return self.write(tpl)


class CustomCssHandler(NotebookBaseHandler):
    """A custom CSS handler."""

    @web.authenticated
    def get(self):
        """Get the custom css file."""

        self.set_header("Content-Type", 'text/css')
        page_config = self.get_page_config()
        custom_css_file = f"{page_config['jupyterConfigDir']}/custom/custom.css"

        if not os.path.isfile(custom_css_file):
            static_path_root = re.match('^(.*?)static', page_config['staticDir'])
            if static_path_root is not None:
                custom_dir = static_path_root.groups()[0]
                custom_css_file = f"{custom_dir}custom/custom.css"

        with open(custom_css_file) as css_f:
            return self.write(css_f.read())


aliases = dict(base_aliases)


class JupyterNotebookApp(NotebookConfigShimMixin, LabServerApp):
    """The notebook server extension app."""

    name = "notebook"
    app_name = "Jupyter Notebook"
    description = "Jupyter Notebook - A web-based notebook environment for interactive computing"
    version = version
    app_version = version
    extension_url = "/"
    default_url = Unicode("/tree", config=True, help="The default URL to redirect to from `/`")
    file_url_prefix = "/tree"
    load_other_extensions = True
    app_dir = app_dir
    subcommands: dict = {}

    expose_app_in_browser = Bool(
        False,
        config=True,
        help="Whether to expose the global app instance to browser via window.jupyterapp",
    )

    custom_css = Bool(
        True,
        config=True,
        help="""Whether custom CSS is loaded on the page.
        Defaults to True and custom CSS is loaded.
        """,
    )

    flags = flags
    flags["expose-app-in-browser"] = (
        {"JupyterNotebookApp": {"expose_app_in_browser": True}},
        "Expose the global app instance to browser via window.jupyterapp.",
    )

    flags["custom-css"] = (
        {"JupyterNotebookApp": {"custom_css": True}},
        "Load custom CSS in template html files. Default is True",
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

    def _prepare_templates(self):
        super(LabServerApp, self)._prepare_templates()
        self.jinja2_env.globals.update(custom_css=self.custom_css)  # type:ignore

    def server_extension_is_enabled(self, extension):
        """Check if server extension is enabled."""
        try:
            extension_enabled = (
                self.serverapp.extension_manager.extensions[extension].enabled is True
            )
        except (AttributeError, KeyError, TypeError):
            extension_enabled = False
        return extension_enabled

    def initialize_handlers(self):
        """Initialize handlers."""
        page_config = self.serverapp.web_app.settings.setdefault("page_config_data", {})
        nbclassic_enabled = self.server_extension_is_enabled("nbclassic")
        page_config["nbclassic_enabled"] = nbclassic_enabled

        # If running under JupyterHub, add more metadata.
        if "hub_prefix" in self.serverapp.tornado_settings:
            tornado_settings = self.serverapp.tornado_settings
            hub_prefix = tornado_settings["hub_prefix"]
            page_config["hubPrefix"] = hub_prefix
            page_config["hubHost"] = tornado_settings["hub_host"]
            page_config["hubUser"] = tornado_settings["user"]
            page_config["shareUrl"] = ujoin(hub_prefix, "user-redirect")
            # Assume the server_name property indicates running JupyterHub 1.0.
            if hasattr(self.serverapp, "server_name"):
                page_config["hubServerName"] = self.serverapp.server_name
            # avoid setting API token in page config
            # $JUPYTERHUB_API_TOKEN identifies the server, not the client
            # but at least make sure we don't use the token
            # if the serverapp set one
            page_config["token"] = ""

        self.handlers.append(("/?", RedirectHandler))
        self.handlers.append(("/tree(.*)", TreeHandler))
        self.handlers.append(("/notebooks(.*)", NotebookHandler))
        self.handlers.append(("/edit(.*)", FileHandler))
        self.handlers.append(("/consoles/(.*)", ConsoleHandler))
        self.handlers.append(("/terminals/(.*)", TerminalHandler))
        self.handlers.append(("/custom/custom.css", CustomCssHandler))
        super().initialize_handlers()

    def initialize(self, argv=None):
        """Subclass because the ExtensionApp.initialize() method does not take arguments"""
        super().initialize()


main = launch_new_instance = JupyterNotebookApp.launch_instance

if __name__ == "__main__":
    main()
