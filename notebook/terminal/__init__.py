import os

import terminado
from ..utils import check_version

if not check_version(terminado.__version__, '0.8.1'):
    raise ImportError("terminado >= 0.8.1 required, found %s" % terminado.__version__)

from ipython_genutils.py3compat import which
from terminado import NamedTermManager
from tornado.log import app_log
from notebook.utils import url_path_join as ujoin
from .handlers import TerminalHandler, TermSocket
from . import api_handlers

def initialize(webapp, notebook_dir, connection_url, settings):
    if os.name == 'nt':
        default_shell = 'powershell.exe'
    else:
        default_shell = which('sh')
    shell = settings.get('shell_command',
        [os.environ.get('SHELL') or default_shell]
    )
    terminal_manager = webapp.settings['terminal_manager'] = NamedTermManager(
        shell_command=shell,
        extra_env={'JUPYTER_SERVER_ROOT': notebook_dir,
                   'JUPYTER_SERVER_URL': connection_url,
                   },
    )
    terminal_manager.log = app_log
    base_url = webapp.settings['base_url']
    handlers = [
        (ujoin(base_url, r"/terminals/(\w+)"), TerminalHandler),
        (ujoin(base_url, r"/terminals/websocket/(\w+)"), TermSocket,
             {'term_manager': terminal_manager}),
        (ujoin(base_url, r"/api/terminals"), api_handlers.TerminalRootHandler),
        (ujoin(base_url, r"/api/terminals/(\w+)"), api_handlers.TerminalHandler),
    ]
    webapp.add_handlers(".*$", handlers)
