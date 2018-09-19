import pytest

from notebook import i18n

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
