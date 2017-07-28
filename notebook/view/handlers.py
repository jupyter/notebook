#encoding: utf-8
"""Tornado handlers for viewing HTML files."""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from tornado import web
from ..base.handlers import IPythonHandler, path_regex
from ..utils import url_escape, url_path_join

class ViewHandler(IPythonHandler):
    """Render HTML files within an iframe."""
    @web.authenticated
    def get(self, path):
        path = path.strip('/')
        if not self.contents_manager.file_exists(path):
            raise web.HTTPError(404, u'File does not exist: %s' % path)

        basename = path.rsplit('/', 1)[-1]
        file_url = url_path_join(self.base_url, 'files', path)
        self.write(
            self.render_template('view.html', file_url=file_url, page_title=basename)
        )

default_handlers = [
    (r"/view%s" % path_regex, ViewHandler),
]
