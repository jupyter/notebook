"""Serve files directly from the ContentsManager."""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import mimetypes
import json

try: #PY3
    from base64 import decodebytes
except ImportError: #PY2
    from base64 import decodestring as decodebytes


from tornado import web

from notebook.base.handlers import IPythonHandler


class FilesHandler(IPythonHandler):
    """serve files via ContentsManager

    Normally used when ContentsManager is not a FileContentsManager.

    FileContentsManager subclasses use AuthenticatedFilesHandler by default,
    a subclass of StaticFileHandler.
    """

    @web.authenticated
    def head(self, path):
        self.get(path, include_body=False)

    @web.authenticated
    def get(self, path, include_body=True):
        cm = self.contents_manager

        if cm.is_hidden(path):
            self.log.info("Refusing to serve hidden file, via 404 Error")
            raise web.HTTPError(404)

        path = path.strip('/')
        if '/' in path:
            _, name = path.rsplit('/', 1)
        else:
            name = path
        
        model = cm.get(path, type='file', content=include_body)
        
        if self.get_argument("download", False):
            self.set_attachment_header(name)
        
        # get mimetype from filename
        if name.endswith('.ipynb'):
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


default_handlers = []
