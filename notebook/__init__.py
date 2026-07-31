from __future__ import annotations

from typing import Any

from ._version import __version__, version_info  # noqa: F401


def _jupyter_server_extension_paths() -> list[dict[str, str]]:
    return [{"module": "notebook"}]


def _jupyter_server_extension_points() -> list[dict[str, Any]]:
    # Deferred import to avoid importing the app at package import time
    from .app import JupyterNotebookApp  # noqa: PLC0415

    return [{"module": "notebook", "app": JupyterNotebookApp}]


def _jupyter_labextension_paths() -> list[dict[str, str]]:
    return [{"src": "labextension", "dest": "@jupyter-notebook/lab-extension"}]
