# coding: utf-8
from ..security import passwd, passwd_check
import nose.tools as nt

def test_passwd_structure():
    p = passwd('passphrase')
    algorithm, hashed = p.split(':')
    nt.assert_equal(algorithm, 'argon2')
    nt.assert_true(hashed.startswith('$argon2id$'))

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
    phash = (u'argon2:$argon2id$v=19$m=10240,t=10,p=8$'
             u'qjjDiZUofUVVnrVYxacnbA$l5pQq1bJ8zglGT2uXP6iOg')
    assert passwd_check(phash, u"łe¶ŧ←↓→")
