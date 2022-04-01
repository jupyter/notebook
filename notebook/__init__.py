from ._version import __version__  # noqa


def _jupyter_server_extension_paths():
    return [{"module": "notebook"}]


def _jupyter_server_extension_points():
    from .app import JupyterNotebookApp

    return [{"module": "notebook", "app": JupyterNotebookApp}]


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "@jupyter-notebook/lab-extension"}]
