"""utilities for checking submodule status"""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import os
import subprocess
import sys

pjoin = os.path.join


def repo_parent():
    """return IPython's parent (i.e. root if run from git)"""
    import jupyter_notebook
    return os.path.abspath(os.path.dirname(jupyter_notebook.__file__))

def submodule_path(root):
    """return submodule path relative to root"""
    return [
        pjoin(root, 'jupyter_notebook', 'static', 'components'),
    ]

def is_repo(d):
    """is d a git repo?"""
    if not os.path.exists(pjoin(d, '.git')):
        return False
    proc = subprocess.Popen('git status',
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE,
                            shell=True,
                            cwd=d,
    )
    status, _ = proc.communicate()
    return status == 0

def check_submodule_status(root=None):
    """check submodule status

    Has three return values:

    'missing' - submodules are absent
    'unclean' - submodules have unstaged changes
    'clean' - all submodules are up to date
    """

    if hasattr(sys, "frozen"):
        # frozen via py2exe or similar, don't bother
        return 'clean'

    if not root:
        root = repo_parent()
    
    if not is_repo(root):
        # not in git, assume clean
        return 'clean'

    submodules = submodule_path(root)

    for submodule in submodules:
        if not os.path.exists(submodule):
            return 'missing'
    
    # Popen can't handle unicode cwd on Windows Python 2
    if sys.platform == 'win32' and sys.version_info[0] < 3 \
        and not isinstance(root, bytes):
        root = root.encode(sys.getfilesystemencoding() or 'ascii')
    # check with git submodule status
    proc = subprocess.Popen('git submodule status',
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE,
                            shell=True,
                            cwd=root,
    )
    status, _ = proc.communicate()
    status = status.decode("ascii", "replace")

    for line in status.splitlines():
        if line.startswith('-'):
            return 'missing'
        elif line.startswith('+'):
            return 'unclean'

    return 'clean'

def update_submodules(repo_dir):
    """update submodules in a repo"""
    subprocess.check_call("git submodule init", cwd=repo_dir, shell=True)
    subprocess.check_call("git submodule update --recursive", cwd=repo_dir, shell=True)

