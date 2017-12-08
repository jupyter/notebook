import json
import os

from notebook.manager import BaseJSONConfigManager


def test_json(tmpdir):
    tmpdir = str(tmpdir)  # we're ok with a regular string path
    with open(os.path.join(tmpdir, 'foo.json'), 'w') as f:
        json.dump(dict(a=1), f)
    # also make a foo.d/ directory with multiple json files
    os.makedirs(os.path.join(tmpdir, 'foo.d'))
    with open(os.path.join(tmpdir, 'foo.d', 'a.json'), 'w') as f:
        json.dump(dict(a=2, b=1), f)
    with open(os.path.join(tmpdir, 'foo.d', 'b.json'), 'w') as f:
        json.dump(dict(a=3, b=2, c=3), f)
    manager = BaseJSONConfigManager(config_dir=tmpdir, read_directory=False)
    data = manager.get('foo')
    assert 'a' in data
    assert 'b' not in data
    assert 'c' not in data
    assert data['a'] == 1

    manager = BaseJSONConfigManager(config_dir=tmpdir, read_directory=True)
    data = manager.get('foo')
    assert 'a' in data
    assert 'b' in data
    assert 'c' in data
    # files should be read in order foo.d/a.json foo.d/b.json foo.json
    assert data['a'] == 1
    assert data['b'] == 2
    assert data['c'] == 3


