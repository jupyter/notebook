# coding: utf-8

import json

from tornado import gen, web

from notebook.utils import url_path_join, url_escape
from jupyter_client.jsonutil import date_default

from notebook.base.handlers import (
    IPythonHandler, APIHandler, json_errors, path_regex,
)
import os
import re
from urllib.parse import urljoin


class UploadHandlers(APIHandler):

    @web.authenticated
    def get(self):
        self.write('bigupload')
        # raise web.HTTPError(404)

    @web.authenticated
    def post(self, path):
        print(path)
        # ignore delete
        print(self.request)
        content_range = self.request.headers.get('Content-Range')
        if content_range:
            content_range = re.split('/| |-', content_range)
            for i in range(1, 4):
                content_range[i] = int(content_range[i])
        else:
            content_length = self.request.headers.get('Content-Length')
            if content_length:
                content_range = ['byte', 0, int(content_length)-1, int(content_length)]
            else:
                raise web.HTTPError(403)
        print(content_range)
        if 'files[]' in self.request.files:
            for file in self.request.files['files[]']:
                # print(self.request.headers.get('Content-Range'))
                files = self.handle_file_upload(path, file['filename'], file['body'], content_range)
        elif 'file' in self.request.files:
            file = self.request.files['file']
            files = self.handle_file_upload(path, file['filename'], file['body'], content_range)
        else:
            raise web.HTTPError(403)
        self.write(self.generate_response({'files': files}))

    def generate_response(self, content):
        self.set_header("Content-Type", "text/plain")
        return content

    def handle_file_upload(self, path, name, body, content_range):
        file = dict()
        file_path = self.get_upload_path(path, name)
        file_path = self.get_unique_name(file_path, content_range[1])
        file['name'] = file_path
        file['size'] = content_range
        file['type'] = 'application/octet-stream'
        file['url'] = urljoin(self.request.host + '/', file_path)
        file['deleteType'] = 'DELETE'
        file['deleteUrl'] = file['url']

        # append_file = content_range and os.path.exists(file_path) and (file['size'] > os.path.getsize(file_path))
        with open(file_path, "ab") as fout:
            fout.write(body)
        file['size'] = os.path.getsize(file_path)
        return file

    def get_upload_path(self, path, name):
        return urljoin(path, name)

    def get_unique_name(self, name, size):
        while os.path.exists(name) and (not os.path.isfile(name)):
            name = self.upcount_name(name)
        while os.path.isfile(name):
            if os.path.getsize(name) == size:
                break
            name = self.upcount_name(name)
        return name

    def upcount_name(self, name):
        split_name = list(os.path.splitext(name))
        regex = '[(]([0-9]+)[)]$'
        match = re.search(regex, split_name[0])
        if match:
            split_name[0], number = re.subn(regex, '(' + str(int(match.group(1)) + 1) + ')', split_name[0])
        else:
            split_name[0] += ' (1)'
        return split_name[0] + split_name[1]

path_regex = r"(.*)"
default_handlers = [
    (r"/api/upload_handlers/(.*)", UploadHandlers),
]

