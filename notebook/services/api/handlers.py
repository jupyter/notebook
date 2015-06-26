"""Tornado handlers for api specifications."""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from tornado import web
from ...base.handlers import IPythonHandler
import os

class APIHandler(web.StaticFileHandler, IPythonHandler):

    def initialize(self):
        web.StaticFileHandler.initialize(self, path=os.path.dirname(__file__))

    @web.authenticated
    def get(self):
        self.log.debug("Serving api")
        return web.StaticFileHandler.get(self, 'api.yaml')

default_handlers = [
    (r"/api", APIHandler)
]
