import json
from tornado import web, gen
from ..base.handlers import APIHandler
from ..prometheus.metrics import TERMINAL_CURRENTLY_RUNNING_TOTAL


class TerminalRootHandler(APIHandler):
    @web.authenticated
    def get(self):
        tm = self.terminal_manager
        terms = [{'name': name} for name in tm.terminals]
        self.finish(json.dumps(terms))

        # Update the metric below to the length of the list 'terms'
        TERMINAL_CURRENTLY_RUNNING_TOTAL.set(
            len(terms)
        )

    @web.authenticated
    def post(self):
        """POST /terminals creates a new terminal and redirects to it"""
        name, _ = self.terminal_manager.new_named_terminal()
        self.finish(json.dumps({'name': name}))

        # Increase the metric by one because a new terminal was created
        TERMINAL_CURRENTLY_RUNNING_TOTAL.inc()


class TerminalHandler(APIHandler):
    SUPPORTED_METHODS = ('GET', 'DELETE')

    @web.authenticated
    def get(self, name):
        tm = self.terminal_manager
        if name in tm.terminals:
            self.finish(json.dumps({'name': name}))
        else:
            raise web.HTTPError(404, "Terminal not found: %r" % name)

    @web.authenticated
    @gen.coroutine
    def delete(self, name):
        tm = self.terminal_manager
        if name in tm.terminals:
            yield tm.terminate(name, force=True)
            self.set_status(204)
            self.finish()

            # Decrease the metric below by one
            # because a terminal has been shutdown
            TERMINAL_CURRENTLY_RUNNING_TOTAL.dec()

        else:
            raise web.HTTPError(404, "Terminal not found: %r" % name)
