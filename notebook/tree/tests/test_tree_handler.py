"""Test the /tree handlers"""
import os
import io
from notebook.utils import url_path_join
from nbformat import write
from nbformat.v4 import new_notebook
try:
    from urllib.parse import urlparse
except ImportError:
    from urlparse import urlparse

import requests

from notebook.tests.launchnotebook import NotebookTestBase

class TreeTest(NotebookTestBase):
    def setUp(self):
        nbdir = self.notebook_dir
        d = os.path.join(nbdir, 'foo')
        os.mkdir(d)

        with io.open(os.path.join(d, 'bar.ipynb'), 'w', encoding='utf-8') as f:
            nb = new_notebook()
            write(nb, f, version=4)

        with io.open(os.path.join(d, 'baz.txt'), 'w', encoding='utf-8') as f:
            f.write(u'flamingo')

        self.base_url()

    def test_redirect(self):
        r = self.request('GET', 'tree/foo/bar.ipynb')
        self.assertEqual(r.url, self.base_url() + 'notebooks/foo/bar.ipynb')

        r = self.request('GET', 'tree/foo/baz.txt', allow_redirects=False)
        self.assertEqual(r.status_code, 302)
        self.assertEqual(r.headers['Location'],
             urlparse(url_path_join(self.base_url(), 'files/foo/baz.txt')).path)
