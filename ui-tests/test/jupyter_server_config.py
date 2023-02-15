from pathlib import Path
from tempfile import mkdtemp
from typing import Any

import jupyterlab

c: Any
c.ServerApp.port = 8888  # noqa
c.ServerApp.port_retries = 0  # noqa
c.ServerApp.open_browser = False  # noqa

c.ServerApp.root_dir = mkdtemp(prefix="galata-test-")  # noqa
c.ServerApp.token = ""  # noqa
c.ServerApp.password = ""  # noqa
c.ServerApp.disable_check_xsrf = True  # noqa

c.JupyterNotebookApp.expose_app_in_browser = True  # noqa
c.LabServerApp.extra_labextensions_path = str(Path(jupyterlab.__file__).parent / "galata")
