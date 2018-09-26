"""Tests for translation utilities"""
import json
import re

import pytest

from notebook import i18n

from .launchnotebook import NotebookTestBase

def test_parse_accept_lang_header():
    palh = i18n.parse_accept_lang_header
    assert palh('') == ()
    assert palh('zh-CN,en-GB;q=0.7,en;q=0.3') == ('zh_CN', 'en_GB', 'en')
    assert palh('nl,fr;q=0') == ('nl',)


@pytest.mark.parametrize(
    'languages, expected',
    [
        (
            ('fr_FR', 'en_GB'),
            ('fr_FR',),
        ),
        (
            (),
            (),
        ),
        (
            ('fr_FR', 'fr', 'fr'),
            ('fr_FR', 'fr'),
        ),
        (
            ('zh_CN', 'fr', 'zh_CN'),
            ('zh_CN', 'fr'),
        ),
    ],
)
def test_filter_languages(languages, expected):
    assert i18n.filter_languages(languages) == expected


class TestAcceptLanguageHeaders(NotebookTestBase):

    def test_notranslate(self):
        headers = {"Accept-Language": ""}
        r = self.request("GET", "/tree/", headers=headers)
        r.raise_for_status()
        html = r.text
        nbjs_translations = self.find_nbjs_translations(html)
        assert list(nbjs_translations.keys()) == ['']

    def find_nbjs_translations(self, html):
        """Find the nbjs_translations object in the HTML page

        Returns the nbjs locale data
        """
        m = re.search(r"nbjs_translations\s*=\s*(.*);", html)
        if m is None:
            return None
        translations = json.loads(m.group(1))
        return translations['locale_data']['nbjs']

    def test_tree_fr(self):
        headers = {"Accept-Language": "fr-FR;q=0.9,en;q=0.5"}
        r = self.request("GET", "/tree/", headers=headers)
        r.raise_for_status()
        html = r.text
        # test a frontend translation
        nbjs_translations = self.find_nbjs_translations(html)
        assert '(autosaved)' in nbjs_translations
        assert nbjs_translations['(autosaved)'] == ['(auto-sauvegardé)']
        # and a backend one
        trans = i18n.get_translation("nbui", ["fr_FR"])
        assert trans.gettext("Files") != "Files"
        assert trans.gettext("Files") in html

    def test_tree_zh(self):
        headers = {"Accept-Language": "zh-CN;q=0.9,en;q=0.5"}
        r = self.request("GET", "/tree/", headers=headers)
        r.raise_for_status()
        html = r.text
        # test a frontend translation
        nbjs_translations = self.find_nbjs_translations(html)
        assert '(autosaved)' in nbjs_translations
        assert nbjs_translations['(autosaved)'] == ['(自动保存)']
        # and a backend one
        trans = i18n.get_translation("nbui", ["zh_CN"])
        assert trans.gettext("Files") != "Files"
        assert trans.gettext("Files") in html
