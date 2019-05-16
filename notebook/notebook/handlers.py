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

    default_exporters = [
        ExporterInfo(name='html', display='html (.html)'),
        ExporterInfo(name='latex', display='latex (.tex)'),
        ExporterInfo(name='markdown', display='markdown (.md)'),
        ExporterInfo(name='notebook', display='notebook (.ipynb)'),
        ExporterInfo(name='pdf', display='pdf (.pdf)'),
        ExporterInfo(name='rst', display='rst (.rst)'),
        ExporterInfo(name='script', display='script (.txt)'),
        ExporterInfo(name='slides', display='slides (.slides.html)')
    ]

    frontend_exporters = []
    for name in get_export_names():
        exporter_class = get_exporter(name)
        exporter_instance = exporter_class()
        ux_name = getattr(exporter_instance, 'export_from_notebook', None)
        super_uxname = getattr(super(exporter_class, exporter_instance),
                               'export_from_notebook', None)

        # Ensure export_from_notebook is explicitly defined & not inherited
        if ux_name is not None and ux_name != super_uxname:
            display = _('{} ({})'.format(ux_name,
                                         exporter_instance.file_extension))
            frontend_exporters.append(ExporterInfo(name, display))

    # Ensure default_exporters are in frontend_exporters if not already
    # This protects againts nbconvert versions lower than 5.5
    names = set(exporter.name.lower() for exporter in frontend_exporters)
    for exporter in default_exporters:
        if exporter.name.lower() not in names:
            frontend_exporters.append(exporter)

    # Protect against nbconvert 5.4.x
    template_exporter = ExporterInfo(name='custom', display='custom (.txt)')
    if template_exporter in frontend_exporters:
        frontend_exporters.remove(template_exporter)
    return sorted(frontend_exporters)


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

