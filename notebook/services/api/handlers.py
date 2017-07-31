"""Tornado handlers for api specifications."""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from itertools import chain
import json

from tornado import gen, web

from ...base.handlers import IPythonHandler, APIHandler, json_errors
from notebook._tz import utcfromtimestamp, isoformat

import os

class APISpecHandler(web.StaticFileHandler, IPythonHandler):

    def initialize(self):
        web.StaticFileHandler.initialize(self, path=os.path.dirname(__file__))

    @web.authenticated
    def get(self):
        self.log.warning("Serving api spec (experimental, incomplete)")
        self.set_header('Content-Type', 'text/x-yaml')
        return web.StaticFileHandler.get(self, 'api.yaml')

class APIStatusHandler(APIHandler):

    _track_activity = False

    @json_errors
    @web.authenticated
    @gen.coroutine
    def get(self):
        # if started was missing, use unix epoch
        started = self.settings.get('started', utcfromtimestamp(0))
        # if we've never seen API activity, use started date
        api_last_activity = self.settings.get('api_last_activity', started)
        started = isoformat(started)
        api_last_activity = isoformat(api_last_activity)

        kernels = yield gen.maybe_future(self.kernel_manager.list_kernels())
        total_connections = sum(k['connections'] for k in kernels)
        last_activity = max(chain([api_last_activity], [k['last_activity'] for k in kernels]))
        model = {
            'started': started,
            'last_activity': last_activity,
            'kernels': len(kernels),
            'connections': total_connections,
        }
        self.finish(json.dumps(model, sort_keys=True))

default_handlers = [
    (r"/api/spec.yaml", APISpecHandler),
    (r"/api/status", APIStatusHandler),
]
