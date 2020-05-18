import os

import terminado
from ..utils import check_version

if not check_version(terminado.__version__, '0.8.1'):
    raise ImportError("terminado >= 0.8.1 required, found %s" % terminado.__version__)

from ipython_genutils.py3compat import which
from tornado.log import app_log
from notebook.utils import url_path_join as ujoin
from .terminalmanager import TerminalManager
from .handlers import TerminalHandler, TermSocket
from . import api_handlers


def initialize(parent):
    if os.name == 'nt':
        default_shell = 'powershell.exe'
    else:
        default_shell = which('sh')
    shell = parent.terminado_settings.get('shell_command',
        [os.environ.get('SHELL') or default_shell]
    )
    # Enable login mode - to automatically source the /etc/profile script
    if os.name != 'nt':
        shell.append('-l')
    terminal_manager = parent.web_app.settings['terminal_manager'] = TerminalManager(
        shell_command=shell,
        extra_env={'JUPYTER_SERVER_ROOT': parent.notebook_dir,
                   'JUPYTER_SERVER_URL': parent.connection_url,
                   },
        parent=parent,
    )
    terminal_manager.log = parent.log
    base_url = parent.web_app.settings['base_url']
    handlers = [
        (ujoin(base_url, r"/terminals/(\w+)"), TerminalHandler),
        (ujoin(base_url, r"/terminals/websocket/(\w+)"), TermSocket,
             {'term_manager': terminal_manager}),
        (ujoin(base_url, r"/api/terminals"), api_handlers.TerminalRootHandler),
        (ujoin(base_url, r"/api/terminals/(\w+)"), api_handlers.TerminalHandler),
    ]
    parent.web_app.add_handlers(".*$", handlers)
