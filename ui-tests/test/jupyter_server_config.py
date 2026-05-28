from typing import Any

from jupyterlab.galata import configure_jupyter_server

c: Any
c.JupyterNotebookApp.expose_app_in_browser = True

configure_jupyter_server(c)

c.MappingKernelManager.kernel_info_timeout = 120
c.MappingKernelManager.cull_idle_timeout = 0
