"""Tornado handlers for the live notebook view."""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from collections import namedtuple
import os
from tornado import web
HTTPError = web.HTTPError

from ..base.handlers import (
    IPythonHandler, FilesRedirectHandler, path_regex,
)
from ..utils import url_escape
from ..transutils import _


def get_frontend_exporters():
    from nbconvert.exporters.base import get_export_names, get_exporter

    ExporterInfo = namedtuple('ExporterInfo', ['name', 'display'])

    for name in sorted(get_export_names()):
        exporter_class = get_exporter(name)
        exporter_instance = exporter_class()
        ux_name = getattr(exporter_instance, 'export_from_notebook', None)
        # ensure export_from_notebook is explicitly defined & not inherited
        super_uxname = getattr(super(exporter_class, exporter_instance),
                               'export_from_notebook',
                               None)
        if ux_name is not None and ux_name != super_uxname:
            display = _('{} ({})'.format(ux_name,
                                         exporter_instance.file_extension))
            yield ExporterInfo(name, display)


class NotebookHandler(IPythonHandler):

    @web.authenticated
    def get(self, path):
        """get renders the notebook template if a name is given, or 
        redirects to the '/files/' handler if the name is not given."""
        path = path.strip('/')
        cm = self.contents_manager
        
        # will raise 404 on not found
        try:
            model = cm.get(path, content=False)
        except web.HTTPError as e:
            if e.status_code == 404 and 'files' in path.split('/'):
                # 404, but '/files/' in URL, let FilesRedirect take care of it
                return FilesRedirectHandler.redirect_to_files(self, path)
            else:
                raise
        if model['type'] != 'notebook':
            # not a notebook, redirect to files
            return FilesRedirectHandler.redirect_to_files(self, path)
        name = path.rsplit('/', 1)[-1]
        self.write(self.render_template('notebook.html',
            notebook_path=path,
            notebook_name=name,
            kill_kernel=False,
            mathjax_url=self.mathjax_url,
            mathjax_config=self.mathjax_config,
            get_frontend_exporters=get_frontend_exporters
            )
        )


#-----------------------------------------------------------------------------
# URL to handler mappings
#-----------------------------------------------------------------------------


default_handlers = [
    (r"/notebooks%s" % path_regex, NotebookHandler),
]

