from typing import Any

from jupyterlab.galata import configure_jupyter_server

c: Any
c.JupyterNotebookApp.expose_app_in_browser = True

configure_jupyter_server(c)


def page_config_hook(handler: Any, page_config: dict[str, Any]) -> dict[str, Any]:
    if handler.get_query_argument("notebookStartsKernel", None) == "false":
        page_config["notebookStartsKernel"] = False
    return page_config


c.ServerApp.tornado_settings = {"page_config_hook": page_config_hook}
