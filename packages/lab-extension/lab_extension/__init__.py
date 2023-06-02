import contextlib


def _load_jupyter_server_extension(server_app):
    """Sets PageConfig nbclassic_enabled depending on if nbclassic is installed

    Parameters
    ----------
    server_app: jupyterlab.labapp.LabApp
        JupyterLab application instance
    """
    nbclassic_enabled = False
    with contextlib.suppress(AttributeError):
        nbclassic_enabled = server_app.nbserver_extensions.get("nbclassic", False)

    from jupyterlab.labapp import LabApp

    LabApp.app_instance.page_config_data = {"nbclassic_enabled": nbclassic_enabled}


# For backward compatibility with notebook server - useful for Binder/JupyterHub
load_jupyter_server_extension = _load_jupyter_server_extension
