#encoding: utf-8
"""Tornado handlers for the terminal emulator."""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import tornado
from tornado import web
import terminado
from ..base.handlers import IPythonHandler

try:
    from urllib.parse import urlparse # Py 3
except ImportError:
    from urlparse import urlparse # Py 2


class TerminalHandler(IPythonHandler):
    """Render the terminal interface."""
    @web.authenticated
    def get(self, term_name):
        self.write(self.render_template('terminal.html',
                   ws_path="terminals/websocket/%s" % term_name))

class TermSocket(IPythonHandler, terminado.TermSocket):

    def set_default_headers(self):
        pass

    def origin_check(self):
        """Override Terminado's origin_check with our own check_origin, confusingly"""
        return self.check_origin()

    
    def get(self, *args, **kwargs):
        if not self.get_current_user():
            raise web.HTTPError(403)
        return super(TermSocket, self).get(*args, **kwargs)
    
    def clear_cookie(self, *args, **kwargs):
        """meaningless for websockets"""
        pass

