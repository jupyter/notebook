from ._version import __version__
from .serverextension import load_jupyter_server_extension


def _jupyter_server_extension_paths():
    return [
        {
            'module': 'notebook'
        }
    ]


def _jupyter_server_extension_points():
    from .app import NotebookApp
    return [{"module": "notebook", "app": NotebookApp}]


def _jupyter_labextension_paths():
    return [{
        'src': 'labextension',
        'dest': '@jupyter-notebook/lab-extension'
    }]