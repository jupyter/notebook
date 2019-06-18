"""Tests for login redirects"""

import requests
from tornado.httputil import url_concat

from notebook.tests.launchnotebook import NotebookTestBase


class LoginTest(NotebookTestBase):
    def login(self, next):
        first = requests.get(self.base_url() + "login")
        first.raise_for_status()
        resp = requests.post(
            url_concat(
                self.base_url() + "login",
                {'next': next},
            ),
            allow_redirects=False,
            data={
                "password": self.token,
                "_xsrf": first.cookies.get("_xsrf", ""),
            },
            cookies=first.cookies,
        )
        resp.raise_for_status()
        return resp.headers['Location']

    def test_next_bad(self):
        for bad_next in (
            "//some-host",
            "//host" + self.url_prefix + "tree",
            "https://google.com",
            "/absolute/not/base_url",
        ):
            url = self.login(next=bad_next)
            self.assertEqual(url, self.url_prefix)
        assert url

    def test_next_ok(self):
        for next_path in (
            "tree/",
            "//" + self.url_prefix + "tree",
            "notebooks/notebook.ipynb",
            "tree//something",
        ):
            expected = self.url_prefix + next_path
            actual = self.login(next=expected)
            self.assertEqual(actual, expected)
