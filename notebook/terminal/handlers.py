#encoding: utf-8
"""Tornado handlers for the terminal emulator."""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from tornado import web
import terminado
from notebook._tz import utcnow
from ..base.handlers import IPythonHandler
from ..base.zmqhandlers import WebSocketMixin


class TerminalHandler(IPythonHandler):
    """Render the terminal interface."""
    @web.authenticated
    def get(self, term_name):
        self.write(self.render_template('terminal.html',
                   ws_path="terminals/websocket/%s" % term_name))


class TermSocket(WebSocketMixin, IPythonHandler, terminado.TermSocket):

    def origin_check(self):
        """Terminado adds redundant origin_check
        
        Tornado already calls check_origin, so don't do anything here.
        """
        return True

    def get(self, *args, **kwargs):
        if not self.get_current_user():
            raise web.HTTPError(403)
        if not args[0] in self.term_manager.terminals:
            raise web.HTTPError(404)
        return super(TermSocket, self).get(*args, **kwargs)

    def on_message(self, message):
        super(TermSocket, self).on_message(message)
        self._update_activity()

    def write_message(self, message, binary=False):
        super(TermSocket, self).write_message(message, binary=binary)
        self._update_activity()

    def _update_activity(self):
        self.application.settings['terminal_last_activity'] = utcnow()
        # terminal may not be around on deletion/cull
        if self.term_name in self.terminal_manager.terminals:
            self.terminal_manager.terminals[self.term_name].last_activity = utcnow()
