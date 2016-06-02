"""Tornado handlers for the tree view."""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import os
from tornado import web
from ..base.handlers import IPythonHandler, FileFindHandler


class LabHandler(IPythonHandler):

    """Render the Jupyter Lab View."""

    @web.authenticated
    def get(self):
        self.write(self.render_template('lab.html',
            page_title='Jupyter Lab',
            terminals_available=self.settings['terminals_available'],
            mathjax_url=self.mathjax_url,
            mathjax_config=self.mathjax_config))

#-----------------------------------------------------------------------------
# URL to handler mappings
#-----------------------------------------------------------------------------

parent = os.path.dirname(os.path.dirname(__file__))

default_handlers = [
    (r"/lab", LabHandler),
    (r"/lab/(.*)", FileFindHandler,
        {'path': os.path.join(parent, 'static', 'lab', 'js', 'built')}),
]
