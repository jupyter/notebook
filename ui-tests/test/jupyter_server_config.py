from tempfile import mkdtemp
from typing import Any

c: Any
c.ServerApp.port = 8888
c.ServerApp.port_retries = 0
c.ServerApp.open_browser = False

c.ServerApp.root_dir = mkdtemp(prefix="galata-test-")
c.ServerApp.token = ""  # noqa
c.ServerApp.password = ""  # noqa
c.ServerApp.disable_check_xsrf = True

c.JupyterNotebookApp.expose_app_in_browser = True
