from ._version import __version__
from .serverextension import load_jupyter_server_extension


def _jupyter_server_extension_paths():
    return [
        {
            'module': 'retrolab'
        }
    ]


def _jupyter_server_extension_points():
    from .app import RetroApp
    return [{"module": "retrolab", "app": RetroApp}]


def _jupyter_labextension_paths():
    return [{
        'src': 'labextension',
        'dest': '@retrolab/lab-extension'
    }]