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

class TermSocket(terminado.TermSocket, IPythonHandler):

    def set_default_headers(self):
        pass

    def check_origin(self, origin):
        """Check Origin for cross-site websockets, required opt-in for Tornado>4

        Copied from APIHandler in handlers (which was in turn copied from WebSocket with changes)

        """
        if self.allow_origin == '*':
            return True

        host = self.request.headers.get("Host")
        origin = self.request.headers.get("Origin")

        # If no header is provided, assume it comes from a script/curl.
        # We are only concerned with cross-site browser stuff here.
        if origin is None or host is None:
            return True

        origin = origin.lower()
        origin_host = urlparse(origin).netloc

        # OK if origin matches host
        if origin_host == host:
            return True

        # Check CORS headers
        if self.allow_origin:
            allow = self.allow_origin == origin
        elif self.allow_origin_pat:
            allow = bool(self.allow_origin_pat.match(origin))
        else:
            # No CORS headers deny the request
            allow = False
        if not allow:
            self.log.warn("Blocking Cross Origin WebSocket request.  Origin: %s, Host: %s",
                origin, host,
            )
        return allow

    def origin_check(self):
        """Override Terminado's origin_check with our own check_origin, confusingly"""
        origin = self.request.headers.get("Origin")
        return self.check_origin(origin)

    
    def get(self, *args, **kwargs):
        if not self.get_current_user():
            raise web.HTTPError(403)
        return super(TermSocket, self).get(*args, **kwargs)
    
    def clear_cookie(self, *args, **kwargs):
        """meaningless for websockets"""
        pass

