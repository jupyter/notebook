"""Tornado handlers for nbconvert."""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import io
import os
import json
import zipfile

from tornado import web, escape
from tornado.log import app_log

from ..base.handlers import (
    IPythonHandler, FilesRedirectHandler,
    path_regex,
)
from nbformat import from_dict
import nbformat
from traitlets.config import Config

from ipython_genutils.py3compat import cast_bytes
from ipython_genutils import text

def find_resource_files(output_files_dir):
    files = []
    for dirpath, dirnames, filenames in os.walk(output_files_dir):
        files.extend([os.path.join(dirpath, f) for f in filenames])
    return files

def respond_zip(handler, name, output, resources):
    """Zip up the output and resource files and respond with the zip file.

    Returns True if it has served a zip file, False if there are no resource
    files, in which case we serve the plain output file.
    """
    # Check if we have resource files we need to zip
    output_files = resources.get('outputs', None)
    if not output_files:
        return False

    # Headers
    zip_filename = os.path.splitext(name)[0] + '.zip'
    handler.set_attachment_header(zip_filename)
    handler.set_header('Content-Type', 'application/zip')

    # create zip file
    buff = io.BytesIO()
    with zipfile.ZipFile(buff, mode='w', compression=zipfile.ZIP_STORED) as zipf:
        output_filename = os.path.splitext(name)[0] + resources['output_extension']
        zipf.writestr(output_filename, cast_bytes(output, 'utf-8'))
        for filename, data in output_files.items():
            zipf.writestr(filename, data)

    # pass zip file back
    buff.seek(0)
    handler.finish(buff.getvalue())
    return True

def get_exporter(format, **kwargs):
    """get an exporter, raising appropriate errors"""
    # if this fails, will raise 500
    try:
        from nbconvert.exporters.base import get_exporter
    except ImportError as e:
        raise web.HTTPError(500, "Could not import nbconvert: %s" % e)

    try:
        Exporter = get_exporter(format)
    except KeyError:
        # should this be 400?
        raise web.HTTPError(404, u"No exporter for format: %s" % format)

    try:
        return Exporter(**kwargs)
    except Exception as e:
        app_log.exception("Could not construct Exporter: %s", Exporter)
        raise web.HTTPError(500, "Could not construct Exporter: %s" % e)

class NbconvertFileHandler(IPythonHandler):
    SUPPORTED_METHODS = ('GET',)

    @web.authenticated
    def get(self, format, path):
        exporter = get_exporter(format, config=self.config, log=self.log)
        path = path.strip('/')
        # If the notebook relates to a real file (default contents manager),
        # give its path to nbconvert.
        if hasattr(self.contents_manager, '_get_os_path'):
            os_path = self.contents_manager._get_os_path(path)
            ext_resources_dir, basename = os.path.split(os_path)
        else:
            ext_resources_dir = None

        model = self.contents_manager.get(path=path)
        nb = model['content']
        name = model['name']
        self.set_header('Last-Modified', model['last_modified'])
        if model['type'] != 'notebook':
            # not a notebook, redirect to files
            return FilesRedirectHandler.redirect_to_files(self, path)
        # create resources dictionary
        mod_date = model['last_modified'].strftime(text.date_format)
        nb_title = os.path.splitext(name)[0]

        resource_dict = {
            "metadata": {
                "name": nb_title,
                "modified_date": mod_date
            },
            "config_dir": self.application.settings['config_dir'],
            "output_files_dir": nb_title+"_files",
        }

        if ext_resources_dir:
            resource_dict['metadata']['path'] = ext_resources_dir

        try:
            output, resources = exporter.from_notebook_node(
                nb,
                resources=resource_dict
            )
        except Exception as e:
            self.log.exception("nbconvert failed: %s", e)
            raise web.HTTPError(500, "nbconvert failed: %s" % e)

        if respond_zip(self, name, output, resources):
            return

        # Force download if requested
        if self.get_argument('download', 'false').lower() == 'true':
            filename = os.path.splitext(name)[0] + resources['output_extension']
            self.set_attachment_header(filename)

        # MIME type
        if exporter.output_mimetype:
            self.set_header('Content-Type',
                            '%s; charset=utf-8' % exporter.output_mimetype)

        self.finish(output)


class NbconvertServiceHandler(IPythonHandler):
    SUPPORTED_METHODS = ('POST',)

    @web.authenticated
    def post(self):

        json_content = self.get_json_body()

        c = Config(self.config)

        # config needs to be dict
        config = json.loads(json_content.get("config",{}))
        c.merge(config)

        # We're adhering to the content model laid out by the notebook data model
        # descriptor:
        # http://jupyter-notebook.readthedocs.io/en/latest/extending/contents.html#data-model
        # validate notebook before converting
        nb_contents = json_content["notebook_contents"]
        try:
            nbformat.validate(nb_contents["content"])
        except nbformat.ValidationError as e:
            self.log.exception("notebook content was not a valid notebook: %s", e)
            raise web.HTTPError(500, "notebook content was not a valid notebook: %s" % e)

        nb = nbformat.from_dict(nb_contents["content"])
        nb_name = nb_contents["name"]
        last_mod = nb_contents.get("modified_date","")

        output_format= json_content["output_format"]
        exporter = get_exporter(output_format, config=c, log=self.log)

        metadata = {}
        metadata['name'] = nb_name[:nb_name.rfind('.')]
        if last_mod:
            metadata['modified_date'] = last_mod.strftime(text.date_format)

        resources_dict= {
            "config_dir": self.application.settings['config_dir'],
            "output_files_dir": nb_name[:nb_name.rfind('.')]+"_files",
            "metadata": metadata
        }

        try:
            output, resources = exporter.from_notebook_node(
                nb,
                resources=resources_dict
            )
        except Exception as e:
            self.log.exception("nbconvert failed: %s", e)
            raise web.HTTPError(500, "nbconvert failed: %s" % e)


        if respond_zip(self, nb_name, output, resources):
            return

        # Force download if requested
        if self.get_argument('download', 'false').lower() == 'true':
            output_filename = os.path.splitext(nb_name)[0] + resources['output_extension']
            self.set_attachment_header(output_filename)

        # MIME type
        if exporter.output_mimetype:
            self.set_header('Content-Type',
                            '%s; charset=utf-8' % exporter.output_mimetype)

        self.finish(output)


class NbconvertPostHandler(IPythonHandler):
    SUPPORTED_METHODS = ('POST',)

    @web.authenticated
    def post(self, format):
        exporter = get_exporter(format, config=self.config)

        model = self.get_json_body()
        name = model.get('name', 'notebook.ipynb')
        nbnode = from_dict(model['content'])

        try:
            output, resources = exporter.from_notebook_node(nbnode, resources={
                "metadata": {"name": name[:name.rfind('.')],},
                "config_dir": self.application.settings['config_dir'],
            })
        except Exception as e:
            raise web.HTTPError(500, "nbconvert failed: %s" % e)

        if respond_zip(self, name, output, resources):
            return

        # MIME type
        if exporter.output_mimetype:
            self.set_header('Content-Type',
                            '%s; charset=utf-8' % exporter.output_mimetype)

        self.finish(output)


#-----------------------------------------------------------------------------
# URL to handler mappings
#-----------------------------------------------------------------------------

_format_regex = r"(?P<format>\w+)"


default_handlers = [
    (r"/nbconvert/%s" % _format_regex, NbconvertPostHandler),
    (r"/nbconvert/%s%s" % (_format_regex, path_regex),
         NbconvertFileHandler),
    (r"/nbconvert", NbconvertServiceHandler),
]
