"""Isolated loopback test server. Never use this configuration in production."""

import json
import sys
from pathlib import Path
from typing import Any

from jupyterlab.galata import configure_jupyter_server

c: Any = get_config()  # noqa: F821 - supplied by Jupyter's configuration loader
configure_jupyter_server(c)
c.ServerApp.ip = "127.0.0.1"
c.JupyterNotebookApp.expose_app_in_browser = True
c.LabServerApp.labextensions_path = [str(Path(sys.prefix) / "share/jupyter/labextensions")]
c.LabServerApp.extra_labextensions_path = []
c.LabApp.app_dir = str(Path(sys.prefix) / "share/jupyter/lab")


def page_config_hook(handler: Any, page_config: dict[str, Any]) -> dict[str, Any]:
    """Allow the browser suite to measure host startup with Neat disabled."""
    if handler.get_query_argument("neatHostBaseline", "false") == "true":
        disabled = page_config.get("disabledExtensions", [])
        if isinstance(disabled, str):
            disabled = json.loads(disabled)
        page_config["disabledExtensions"] = [*disabled, "neat-notebook"]
    return page_config


c.ServerApp.tornado_settings = {"page_config_hook": page_config_hook}
