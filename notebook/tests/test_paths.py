
import re

from notebook.base.handlers import path_regex

# build regexps that tornado uses:
path_pat = re.compile('^' + '/x%s' % path_regex + '$')

def test_path_regex():
    for path in (
        '/x',
        '/x/',
        '/x/foo',
        '/x/foo.ipynb',
        '/x/foo/bar',
        '/x/foo/bar.txt',
    ):
        print(type(path))
        print(type(path_pat))
        assert re.match(path_pat, path)

def test_path_regex_bad():
    for path in (
        '/xfoo',
        '/xfoo/',
        '/xfoo/bar',
        '/xfoo/bar/',
        '/x/foo/bar/',
        '/x//foo',
        '/y',
        '/y/x/foo',
    ):
        assert not re.match(path_pat, path)
