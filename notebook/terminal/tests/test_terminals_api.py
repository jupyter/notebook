"""Test the terminal service API."""

import time

from requests import HTTPError
from traitlets.config import Config

from notebook.utils import url_path_join
from notebook.tests.launchnotebook import NotebookTestBase, assert_http_error


class TerminalAPI(object):
    """Wrapper for terminal REST API requests"""
    def __init__(self, request, base_url, headers):
        self.request = request
        self.base_url = base_url
        self.headers = headers

    def _req(self, verb, path, body=None):
        response = self.request(verb, path, data=body)

        if 400 <= response.status_code < 600:
            try:
                response.reason = response.json()['message']
            except:
                pass
        response.raise_for_status()

        return response

    def list(self):
        return self._req('GET', 'api/terminals')

    def get(self, name):
        return self._req('GET', url_path_join('api/terminals', name))

    def start(self):
        return self._req('POST', 'api/terminals')

    def shutdown(self, name):
        return self._req('DELETE', url_path_join('api/terminals', name))


class TerminalAPITest(NotebookTestBase):
    """Test the terminals web service API"""
    def setUp(self):
        self.term_api = TerminalAPI(self.request,
                                  base_url=self.base_url(),
                                  headers=self.auth_headers(),
                                  )

    def tearDown(self):
        for k in self.term_api.list().json():
            self.term_api.shutdown(k['name'])

    def test_no_terminals(self):
        # Make sure there are no terminals running at the start
        terminals = self.term_api.list().json()
        self.assertEqual(terminals, [])

    def test_create_terminal(self):
        # POST request
        r = self.term_api._req('POST', 'api/terminals')
        term1 = r.json()
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(term1, dict)

    def test_terminal_root_handler(self):
        # POST request
        r = self.term_api.start()
        term1 = r.json()
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(term1, dict)

        # GET request
        r = self.term_api.list()
        self.assertEqual(r.status_code, 200)
        assert isinstance(r.json(), list)
        self.assertEqual(r.json()[0]['name'], term1['name'])

        # create another terminal and check that they both are added to the
        # list of terminals from a GET request
        term2 = self.term_api.start().json()
        assert isinstance(term2, dict)
        r = self.term_api.list()
        terminals = r.json()
        self.assertEqual(r.status_code, 200)
        assert isinstance(terminals, list)
        self.assertEqual(len(terminals), 2)

    def test_terminal_handler(self):
        # GET terminal with given name
        term = self.term_api.start().json()['name']
        r = self.term_api.get(term)
        term1 = r.json()
        self.assertEqual(r.status_code, 200)
        assert isinstance(term1, dict)
        self.assertIn('name', term1)
        self.assertEqual(term1['name'], term)

        # Request a bad terminal id and check that a JSON
        # message is returned!
        bad_term = 'nonExistentTerm'
        with assert_http_error(404, 'Terminal not found: ' + bad_term):
            self.term_api.get(bad_term)

        # DELETE terminal with name
        r = self.term_api.shutdown(term)
        self.assertEqual(r.status_code, 204)
        terminals = self.term_api.list().json()
        self.assertEqual(terminals, [])

        # Request to delete a non-existent terminal name
        bad_term = 'nonExistentTerm'
        with assert_http_error(404, 'Terminal not found: ' + bad_term):
            self.term_api.shutdown(bad_term)


class TerminalCullingTest(NotebookTestBase):

    # Configure culling
    config = Config({
        'NotebookApp': {
            'TerminalManager': {
                'cull_interval': 3,
                'cull_inactive_timeout': 2
            }
        }
    })

    def setUp(self):
        self.term_api = TerminalAPI(self.request,
                                  base_url=self.base_url(),
                                  headers=self.auth_headers(),
                                  )

    def tearDown(self):
        for k in self.term_api.list().json():
            self.term_api.shutdown(k['name'])

    # Sanity check verifying that the configurable was properly set.
    def test_config(self):
        self.assertEqual(self.config.NotebookApp.TerminalManager.cull_inactive_timeout, 2)
        self.assertEqual(self.config.NotebookApp.TerminalManager.cull_interval, 3)
        terminal_mgr = self.notebook.web_app.settings['terminal_manager']
        self.assertEqual(terminal_mgr.cull_inactive_timeout, 2)
        self.assertEqual(terminal_mgr.cull_interval, 3)

    def test_culling(self):
        # POST request
        r = self.term_api.start()
        self.assertEqual(r.status_code, 200)
        body = r.json()
        term1 = body['name']
        last_activity = body['last_activity']

        culled = False
        for i in range(10):  # Culling should occur in a few seconds
            try:
                r = self.term_api.get(term1)
            except HTTPError as e:
                self.assertEqual(e.response.status_code, 404)
                culled = True
                break
            else:
                self.assertEqual(r.status_code, 200)
                time.sleep(1)

        self.assertTrue(culled)
