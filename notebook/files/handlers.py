"""Serve files directly from the ContentsManager."""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import mimetypes
import json
import asyncio
import pathlib
from base64 import decodebytes

from tornado import gen, web, iostream

from notebook.base.handlers import IPythonHandler
from notebook.utils import maybe_future

from .utils import make_archive_writer


class FilesHandler(IPythonHandler):
    """serve files via ContentsManager

    Normally used when ContentsManager is not a FileContentsManager.

    FileContentsManager subclasses use AuthenticatedFilesHandler by default,
    a subclass of StaticFileHandler.
    """

    @property
    def content_security_policy(self):
        # In case we're serving HTML/SVG, confine any Javascript to a unique
        # origin so it can't interact with the notebook server.
        return super(FilesHandler, self).content_security_policy + \
               "; sandbox allow-scripts"

    @web.authenticated
    def head(self, path):
        self.check_xsrf_cookie()
        return self.get(path, include_body=False)

    @web.authenticated
    @gen.coroutine
    def get(self, path, include_body=True):
        # /files/ requests must originate from the same site
        self.check_xsrf_cookie()
        cm = self.contents_manager

        if cm.is_hidden(path) and not cm.allow_hidden:
            self.log.info("Refusing to serve hidden file, via 404 Error")
            raise web.HTTPError(404)

        path = path.strip('/')
        if '/' in path:
            _, name = path.rsplit('/', 1)
        else:
            name = path

        model = yield maybe_future(cm.get(path, type='file', content=include_body))

        if self.get_argument("download", False):
            self.set_attachment_header(name)

        # get mimetype from filename
        if name.lower().endswith('.ipynb'):
            self.set_header('Content-Type', 'application/x-ipynb+json')
        else:
            cur_mime = mimetypes.guess_type(name)[0]
            if cur_mime == 'text/plain':
                self.set_header('Content-Type', 'text/plain; charset=UTF-8')
            elif cur_mime is not None:
                self.set_header('Content-Type', cur_mime)
            else:
                if model['format'] == 'base64':
                    self.set_header('Content-Type', 'application/octet-stream')
                else:
                    self.set_header('Content-Type', 'text/plain; charset=UTF-8')

        if include_body:
            if model['format'] == 'base64':
                b64_bytes = model['content'].encode('ascii')
                self.write(decodebytes(b64_bytes))
            elif model['format'] == 'json':
                self.write(json.dumps(model['content']))
            else:
                self.write(model['content'])
            self.flush()


class DirectoriesHandler(IPythonHandler):
    """serve directories via ContentsManager

    Normally used when ContentsManager is not a FileContentsManager.

    FileContentsManager subclasses use AuthenticatedFilesHandler by default,
    a subclass of StaticFileHandler.
    """

    @property
    def content_security_policy(self):
        # In case we're serving HTML/SVG, confine any Javascript to a unique
        # origin so it can't interact with the notebook server.
        return super(DirectoriesHandler, self).content_security_policy + \
               "; sandbox allow-scripts"

    @web.authenticated
    def head(self, path):
        self.check_xsrf_cookie()
        return self.get(path, include_body=False)

    @web.authenticated
    @gen.coroutine
    def get(self, archive_path, include_body=True):
        # /directories/ requests must originate from the same site
        self.check_xsrf_cookie()
        cm = self.contents_manager

        if cm.is_hidden(archive_path) and not cm.allow_hidden:
            self.log.info("Refusing to serve hidden file, via 404 Error")
            raise web.HTTPError(404)

        archive_token = self.get_argument('archiveToken')
        archive_format = self.get_argument('archiveFormat', 'zip')

        task = asyncio.ensure_future(self.archive_and_download(archive_path, archive_format, archive_token))

        try:
            yield task
        except asyncio.CancelledError:
            task.cancel()

    @gen.coroutine
    def archive_and_download(self, archive_path, archive_format, archive_token):

        archive_path = pathlib.Path(archive_path)
        archive_name = archive_path.name
        archive_filename = archive_path.with_suffix(".{}".format(archive_format)).name

        # We gonna send out event streams!
        self.set_header('content-type', 'application/octet-stream')
        self.set_header('cache-control', 'no-cache')
        self.set_header('content-disposition',
                        'attachment; filename={}'.format(archive_filename))

        try:
            self.log.info('Prepare {} for archiving and downloading.'.format(archive_filename))
            archive_writer = make_archive_writer(self, archive_format)

            with archive_writer as writer:
                for file_path in archive_path.rglob("*"):
                    if file_path.is_file():
                        writer.add(file_path, file_path.relative_to(archive_path))
                        yield self.flush()

        except iostream.StreamClosedError:
            self.log.info('Downloading {} has been canceled by the client.'.format(archive_filename))
            del writer
            raise asyncio.CancelledError

        else:
            self.set_cookie("archiveToken", archive_token)
            self.log.info('Finished downloading {}.'.format(archive_filename))


default_handlers = [
    (r"/directories/(.*)", DirectoriesHandler)
]
print("******************************")