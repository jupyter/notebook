# coding: utf-8
from ..security import passwd, passwd_check, salt_len
import nose.tools as nt

def test_passwd_structure():
    p = passwd('passphrase')
    algorithm, hashed = p.split(':')
    nt.assert_equal(algorithm, 'bcrypt')
    nt.assert_true(hashed.startswith('$2b$'))

def test_roundtrip():
    p = passwd('passphrase')
    nt.assert_equal(passwd_check(p, 'passphrase'), True)

def test_bad():
    p = passwd('passphrase')
    nt.assert_equal(passwd_check(p, p), False)
    nt.assert_equal(passwd_check(p, 'a:b:c:d'), False)
    nt.assert_equal(passwd_check(p, 'a:b'), False)

def test_passwd_check_unicode():
    # GH issue #4524
    phash = u'sha1:23862bc21dd3:7a415a95ae4580582e314072143d9c382c491e4f'
    assert passwd_check(phash, u"łe¶ŧ←↓→")
    phash = (u'bcrypt:$2b$12$'
             u'/IwxT/HWZRlDczICrZQVr.Mg0K5eu9Sv817lgf8qUd8goygYs1OlO')
    assert passwd_check(phash, u"łe¶ŧ←↓→")
