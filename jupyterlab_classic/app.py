import os

from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.extension.handler import (
    ExtensionHandlerMixin,
    ExtensionHandlerJinjaMixin,
)
from jupyterlab import LabApp
from jupyter_server.utils import url_path_join as ujoin
from tornado import web

from ._version import __version__

HERE = os.path.dirname(__file__)
version = __version__


class ClassicHandler(ExtensionHandlerJinjaMixin, ExtensionHandlerMixin, JupyterHandler):
    @web.authenticated
    def get(self):
        config_data = {
            "appVersion": version,
            "baseUrl": self.base_url,
            "token": self.settings["token"],
            "fullStaticUrl": ujoin(self.base_url, "static", self.name),
            "frontendUrl": ujoin(self.base_url, "classic/"),
        }
        return self.write(
            self.render_template(
                "index.html",
                static=self.static_url,
                base_url=self.base_url,
                token=self.settings["token"],
                page_config=config_data,
            )
        )


class ClassicApp(LabApp):

    extension_url = '/classic'
    app_url = "/classic"
    load_other_extensions = True
    name = __name__
    app_name = 'JupyterLab Classic'
    static_dir = os.path.join(HERE, 'static')
    templates_dir = os.path.join(HERE, 'templates')
    app_version = version

    def initialize_handlers(self):
        super().initialize_handlers()
        self.handlers.append(('/classic', ClassicHandler))


main = launch_new_instance = ClassicApp.launch_instance

if __name__ == '__main__':
    main()
