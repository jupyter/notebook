"""Test the sessions web service API."""

import errno
import io
import os
import json
import requests
import shutil
import time

pjoin = os.path.join

from notebook.utils import url_path_join
from notebook.tests.launchnotebook import NotebookTestBase, assert_http_error
from nbformat.v4 import new_notebook
from nbformat import write

class SessionAPI(object):
    """Wrapper for notebook API calls."""
    def __init__(self, request):
        self.request = request

    def _req(self, verb, path, body=None):
        response = self.request(verb,
                url_path_join('api/sessions', path), data=body)

        if 400 <= response.status_code < 600:
            try:
                response.reason = response.json()['message']
            except:
                pass
        response.raise_for_status()

        return response

    def list(self):
        return self._req('GET', '')

    def get(self, id):
        return self._req('GET', id)

    def create(self, path, type='notebook', kernel_name='python', kernel_id=None):
        body = json.dumps({'path': path,
                           'type': type,
                           'kernel': {'name': kernel_name,
                                      'id': kernel_id}})
        return self._req('POST', '', body)

    def create_deprecated(self, path):
        body = json.dumps({'notebook': {'path': path},
                           'kernel': {'name': 'python',
                                      'id': 'foo'}})
        return self._req('POST', '', body)

    def modify_path(self, id, path):
        body = json.dumps({'path': path})
        return self._req('PATCH', id, body)

    def modify_path_deprecated(self, id, path):
        body = json.dumps({'notebook': {'path': path}})
        return self._req('PATCH', id, body)

    def modify_type(self, id, type):
        body = json.dumps({'type': type})
        return self._req('PATCH', id, body)

    def modify_kernel_name(self, id, kernel_name):
        body = json.dumps({'kernel': {'name': kernel_name}})
        return self._req('PATCH', id, body)

    def modify_kernel_id(self, id, kernel_id):
        # Also send a dummy name to show that id takes precedence.
        body = json.dumps({'kernel': {'id': kernel_id, 'name': 'foo'}})
        return self._req('PATCH', id, body)

    def delete(self, id):
        return self._req('DELETE', id)

class SessionAPITest(NotebookTestBase):
    """Test the sessions web service API"""
    def setUp(self):
        nbdir = self.notebook_dir.name
        try:
            os.mkdir(pjoin(nbdir, 'foo'))
        except OSError as e:
            # Deleting the folder in an earlier test may have failed
            if e.errno != errno.EEXIST:
                raise

        with io.open(pjoin(nbdir, 'foo', 'nb1.ipynb'), 'w',
                     encoding='utf-8') as f:
            nb = new_notebook()
            write(nb, f, version=4)

        self.sess_api = SessionAPI(self.request)

    def tearDown(self):
        for session in self.sess_api.list().json():
            self.sess_api.delete(session['id'])
        # This is necessary in some situations on Windows: without it, it
        # fails to delete the directory because something is still using it. I
        # think there is a brief period after the kernel terminates where
        # Windows still treats its working directory as in use. On my Windows
        # VM, 0.01s is not long enough, but 0.1s appears to work reliably.
        # -- TK, 15 December 2014
        time.sleep(0.1)

        shutil.rmtree(pjoin(self.notebook_dir.name, 'foo'),
                      ignore_errors=True)

    def test_create(self):
        sessions = self.sess_api.list().json()
        self.assertEqual(len(sessions), 0)

        resp = self.sess_api.create('foo/nb1.ipynb')
        self.assertEqual(resp.status_code, 201)
        newsession = resp.json()
        self.assertIn('id', newsession)
        self.assertEqual(newsession['path'], 'foo/nb1.ipynb')
        self.assertEqual(newsession['type'], 'notebook')
        self.assertEqual(resp.headers['Location'], self.url_prefix + 'api/sessions/{0}'.format(newsession['id']))

        sessions = self.sess_api.list().json()
        self.assertEqual(sessions, [newsession])

        # Retrieve it
        sid = newsession['id']
        got = self.sess_api.get(sid).json()
        self.assertEqual(got, newsession)

    def test_create_file_session(self):
        resp = self.sess_api.create('foo/nb1.py', type='file')
        self.assertEqual(resp.status_code, 201)
        newsession = resp.json()
        self.assertEqual(newsession['path'], 'foo/nb1.py')
        self.assertEqual(newsession['type'], 'file')

    def test_create_console_session(self):
        resp = self.sess_api.create('foo/abc123', type='console')
        self.assertEqual(resp.status_code, 201)
        newsession = resp.json()
        self.assertEqual(newsession['path'], 'foo/abc123')
        self.assertEqual(newsession['type'], 'console')

    def test_create_deprecated(self):
        resp = self.sess_api.create_deprecated('foo/nb1.ipynb')
        self.assertEqual(resp.status_code, 201)
        newsession = resp.json()
        self.assertEqual(newsession['path'], 'foo/nb1.ipynb')
        self.assertEqual(newsession['type'], 'notebook')
        self.assertEqual(newsession['notebook']['path'], 'foo/nb1.ipynb')

    def test_create_with_kernel_id(self):
        # create a new kernel
        r = self.request('POST', 'api/kernels')
        r.raise_for_status()
        kernel = r.json()

        resp = self.sess_api.create('foo/nb1.ipynb', kernel_id=kernel['id'])
        self.assertEqual(resp.status_code, 201)
        newsession = resp.json()
        self.assertIn('id', newsession)
        self.assertEqual(newsession['path'], 'foo/nb1.ipynb')
        self.assertEqual(newsession['kernel']['id'], kernel['id'])
        self.assertEqual(resp.headers['Location'], self.url_prefix + 'api/sessions/{0}'.format(newsession['id']))

        sessions = self.sess_api.list().json()
        self.assertEqual(sessions, [newsession])

        # Retrieve it
        sid = newsession['id']
        got = self.sess_api.get(sid).json()
        self.assertEqual(got, newsession)

    def test_delete(self):
        newsession = self.sess_api.create('foo/nb1.ipynb').json()
        sid = newsession['id']

        resp = self.sess_api.delete(sid)
        self.assertEqual(resp.status_code, 204)

        sessions = self.sess_api.list().json()
        self.assertEqual(sessions, [])

        with assert_http_error(404):
            self.sess_api.get(sid)

    def test_modify_path(self):
        newsession = self.sess_api.create('foo/nb1.ipynb').json()
        sid = newsession['id']

        changed = self.sess_api.modify_path(sid, 'nb2.ipynb').json()
        self.assertEqual(changed['id'], sid)
        self.assertEqual(changed['path'], 'nb2.ipynb')

    def test_modify_path_deprecated(self):
        newsession = self.sess_api.create('foo/nb1.ipynb').json()
        sid = newsession['id']

        changed = self.sess_api.modify_path_deprecated(sid, 'nb2.ipynb').json()
        self.assertEqual(changed['id'], sid)
        self.assertEqual(changed['notebook']['path'], 'nb2.ipynb')

    def test_modify_type(self):
        newsession = self.sess_api.create('foo/nb1.ipynb').json()
        sid = newsession['id']

        changed = self.sess_api.modify_type(sid, 'console').json()
        self.assertEqual(changed['id'], sid)
        self.assertEqual(changed['type'], 'console')

    def test_modify_kernel_name(self):
        before = self.sess_api.create('foo/nb1.ipynb').json()
        sid = before['id']

        after = self.sess_api.modify_kernel_name(sid, before['kernel']['name']).json()
        self.assertEqual(after['id'], sid)
        self.assertEqual(after['path'], before['path'])
        self.assertEqual(after['type'], before['type'])
        self.assertNotEqual(after['kernel']['id'], before['kernel']['id'])

        # check kernel list, to be sure previous kernel was cleaned up
        r = self.request('GET', 'api/kernels')
        r.raise_for_status()
        kernel_list = r.json()
        self.assertEqual(kernel_list, [after['kernel']])

    def test_modify_kernel_id(self):
        before = self.sess_api.create('foo/nb1.ipynb').json()
        sid = before['id']

        # create a new kernel
        r = self.request('POST', 'api/kernels')
        r.raise_for_status()
        kernel = r.json()

        # Attach our session to the existing kernel
        after = self.sess_api.modify_kernel_id(sid, kernel['id']).json()
        self.assertEqual(after['id'], sid)
        self.assertEqual(after['path'], before['path'])
        self.assertEqual(after['type'], before['type'])
        self.assertNotEqual(after['kernel']['id'], before['kernel']['id'])
        self.assertEqual(after['kernel']['id'], kernel['id'])

        # check kernel list, to be sure previous kernel was cleaned up
        r = self.request('GET', 'api/kernels')
        r.raise_for_status()
        kernel_list = r.json()
        self.assertEqual(kernel_list, [kernel])
