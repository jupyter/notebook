import nose.tools as nt

from notebook import i18n

def test_parse_accept_lang_header():
    palh = i18n.parse_accept_lang_header
    nt.assert_equal(palh(''), [])
    nt.assert_equal(palh('zh-CN,en-GB;q=0.7,en;q=0.3'),
                    ['en', 'en_GB', 'zh_CN'])
    nt.assert_equal(palh('nl,fr;q=0'), ['nl'])
