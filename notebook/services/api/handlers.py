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
        self.set_header('Content-Type', 'text/x-yaml')
        return web.StaticFileHandler.get(self, 'api.yaml')

    @web.authenticated
    def options(self, section_name):
        self.set_header('Access-Control-Allow-Headers', 'accept, content-type')
        self.set_header('Access-Control-Allow-Methods',
                        'GET, PUT, POST, PATCH, DELETE, OPTIONS')
        self.finish()

default_handlers = [
    (r"/api/spec.yaml", APIHandler)
]
