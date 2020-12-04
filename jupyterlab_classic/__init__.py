from ._version import __version__
from .app import ClassicApp
from .serverextension import load_jupyter_server_extension


def _jupyter_server_extension_paths():
    return [
        {
            'module': 'jupyterlab_classic'
        }
    ]


def _jupyter_server_extension_points():
    return [{"module": "jupyterlab_classic", "app": ClassicApp}]
