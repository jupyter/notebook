from pathlib import Path
from tempfile import mkdtemp
from typing import Any

import jupyterlab

c: Any
c.ServerApp.port = 8888
c.ServerApp.port_retries = 0
c.ServerApp.open_browser = False

c.ServerApp.root_dir = mkdtemp(prefix="galata-test-")
c.ServerApp.token = ""
c.ServerApp.password = ""
c.ServerApp.disable_check_xsrf = True

c.JupyterNotebookApp.expose_app_in_browser = True
c.LabServerApp.extra_labextensions_path = str(Path(jupyterlab.__file__).parent / "galata")
