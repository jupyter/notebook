"""
This module defines the things that are used in setup.py for building the notebook

This includes:

    * Functions for finding things like packages, package data, etc.
    * A function for checking dependencies.
"""

# Copyright (c) IPython Development Team.
# Distributed under the terms of the Modified BSD License.

import os
import re
import pipes
import shutil
import sys

from distutils import log
from distutils.cmd import Command
from fnmatch import fnmatch
from glob import glob
from multiprocessing.pool import ThreadPool
from subprocess import check_call

if sys.platform == 'win32':
    from subprocess import list2cmdline
else:
    def list2cmdline(cmd_list):
        return ' '.join(map(pipes.quote, cmd_list))


#-------------------------------------------------------------------------------
# Useful globals and utility functions
#-------------------------------------------------------------------------------

# A few handy globals
isfile = os.path.isfile
pjoin = os.path.join
repo_root = os.path.dirname(os.path.abspath(__file__))
is_repo = os.path.isdir(pjoin(repo_root, '.git'))

def oscmd(s):
    print(">", s)
    os.system(s)

# Py3 compatibility hacks, without assuming IPython itself is installed with
# the full py3compat machinery.

try:
    execfile
except NameError:
    def execfile(fname, globs, locs=None):
        locs = locs or globs
        exec(compile(open(fname).read(), fname, "exec"), globs, locs)


#---------------------------------------------------------------------------
# Basic project information
#---------------------------------------------------------------------------

name = 'notebook'

# release.py contains version, authors, license, url, keywords, etc.
version_ns = {}
execfile(pjoin(repo_root, name, '_version.py'), version_ns)

version = version_ns['__version__']


# vendored from pep440 package, we allow `.dev` suffix without trailing number.
loose_pep440re = re.compile(r'^([1-9]\d*!)?(0|[1-9]\d*)(\.(0|[1-9]\d*))*((a|b|rc)(0|[1-9]\d*))?(\.post(0|[1-9]\d*))?(\.dev(0|[1-9]\d*)?)?$')
if not loose_pep440re.match(version):
    raise ValueError('Invalid version number `%s`, please follow pep440 convention or pip will get confused about which package is more recent.' % version)


#---------------------------------------------------------------------------
# Find packages
#---------------------------------------------------------------------------

def find_packages():
    """
    Find all of the packages.
    """
    packages = []
    for dir,subdirs,files in os.walk(name):
        package = dir.replace(os.path.sep, '.')
        if '__init__.py' not in files:
            # not a package
            continue
        packages.append(package)
    return packages


#---------------------------------------------------------------------------
# Find package data
#---------------------------------------------------------------------------

def find_package_data():
    """
    Find package_data.
    """
    # This is not enough for these things to appear in a sdist.
    # We need to muck with the MANIFEST to get this to work

    # walk notebook resources:
    cwd = os.getcwd()
    os.chdir('notebook')

    os.chdir(cwd)

    package_data = {
        'notebook' : ['templates/*'],
        'notebook.bundler.tests': ['resources/*', 'resources/*/*', 'resources/*/*/.*'],
        'notebook.services.api': ['api.yaml'],
        'notebook.i18n': ['*/LC_MESSAGES/*.*'],
    }

    return package_data


def check_package_data(package_data):
    """verify that package_data globs make sense"""
    print("checking package data")
    for pkg, data in package_data.items():
        pkg_root = pjoin(*pkg.split('.'))
        for d in data:
            path = pjoin(pkg_root, d)
            if '*' in path:
                assert len(glob(path)) > 0, "No files match pattern %s" % path
            else:
                assert os.path.exists(path), "Missing package data: %s" % path


def check_package_data_first(command):
    """decorator for checking package_data before running a given command

    Probably only needs to wrap build_py
    """
    class DecoratedCommand(command):
        def run(self):
            check_package_data(self.package_data)
            command.run(self)
    return DecoratedCommand


def update_package_data(distribution):
    """update package_data to catch changes during setup"""
    build_py = distribution.get_command_obj('build_py')
    distribution.package_data = find_package_data()
    # re-init build_py options which load package_data
    build_py.finalize_options()


#---------------------------------------------------------------------------
# Notebook related
#---------------------------------------------------------------------------

try:
    from shutil import which
except ImportError:
    ## which() function copied from Python 3.4.3; PSF license
    def which(cmd, mode=os.F_OK | os.X_OK, path=None):
        """Given a command, mode, and a PATH string, return the path which
        conforms to the given mode on the PATH, or None if there is no such
        file.

        `mode` defaults to os.F_OK | os.X_OK. `path` defaults to the result
        of os.environ.get("PATH"), or can be overridden with a custom search
        path.

        """
        # Check that a given file can be accessed with the correct mode.
        # Additionally check that `file` is not a directory, as on Windows
        # directories pass the os.access check.
        def _access_check(fn, mode):
            return (os.path.exists(fn) and os.access(fn, mode)
                    and not os.path.isdir(fn))

        # If we're given a path with a directory part, look it up directly rather
        # than referring to PATH directories. This includes checking relative to the
        # current directory, e.g. ./script
        if os.path.dirname(cmd):
            if _access_check(cmd, mode):
                return cmd
            return None

        if path is None:
            path = os.environ.get("PATH", os.defpath)
        if not path:
            return None
        path = path.split(os.pathsep)

        if sys.platform == "win32":
            # The current directory takes precedence on Windows.
            if not os.curdir in path:
                path.insert(0, os.curdir)

            # PATHEXT is necessary to check on Windows.
            pathext = os.environ.get("PATHEXT", "").split(os.pathsep)
            # See if the given file matches any of the expected path extensions.
            # This will allow us to short circuit when given "python.exe".
            # If it does match, only test that one, otherwise we have to try
            # others.
            if any(cmd.lower().endswith(ext.lower()) for ext in pathext):
                files = [cmd]
            else:
                files = [cmd + ext for ext in pathext]
        else:
            # On other platforms you don't have things like PATHEXT to tell you
            # what file suffixes are executable, so just pass on cmd as-is.
            files = [cmd]

        seen = set()
        for dir in path:
            normdir = os.path.normcase(dir)
            if not normdir in seen:
                seen.add(normdir)
                for thefile in files:
                    name = os.path.join(dir, thefile)
                    if _access_check(name, mode):
                        return name
        return None


static = pjoin(repo_root, 'notebook', 'static')


def mtime(path):
    """shorthand for mtime"""
    return os.stat(path).st_mtime


def run(cmd, *args, **kwargs):
    """Echo a command before running it"""
    log.info('> ' + list2cmdline(cmd))
    kwargs['shell'] = (sys.platform == 'win32')
    return check_call(cmd, *args, **kwargs)


class CompileBackendTranslation(Command):
    description = "compile the .po files into .mo files, that contain the translations."

    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass


    def run(self):
        paths = glob('notebook/i18n/??_??')
        for p in paths:
            LANG = p[-5:]
            for component in ['notebook', 'nbui']:
                run(['pybabel', 'compile',
                     '-D', component,
                     '-f',
                     '-l', LANG,
                     '-i', pjoin('notebook', 'i18n', LANG, 'LC_MESSAGES', component+'.po'),
                     '-o', pjoin('notebook', 'i18n', LANG, 'LC_MESSAGES', component+'.mo')
                    ])


def patch_out_bootstrap_bw_print():
    """Hack! Manually patch out the bootstrap rule that forces printing in B&W.

    We haven't found a way to override this rule with another one.
    """
    print_less = pjoin(static, 'components', 'bootstrap', 'less', 'print.less')
    with open(print_less) as f:
        lines = f.readlines()

    for ix, line in enumerate(lines):
        if 'Black prints faster' in line:
            break
    else:
        return  # Already patched out, nothing to do.

    rmed = lines.pop(ix)
    print("Removed line", ix, "from bootstrap print.less:")
    print("-", rmed)
    print()
    with open(print_less, 'w') as f:
        f.writelines(lines)

