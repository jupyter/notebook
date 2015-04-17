# encoding: utf-8
"""
This module defines the things that are used in setup.py for building the notebook

This includes:

    * Functions for finding things like packages, package data, etc.
    * A function for checking dependencies.
"""

# Copyright (c) IPython Development Team.
# Distributed under the terms of the Modified BSD License.

from __future__ import print_function

import os
import sys

from distutils import log
from distutils.command.build_py import build_py
from distutils.cmd import Command
from distutils.errors import DistutilsExecError
from fnmatch import fnmatch
from glob import glob
from subprocess import Popen, PIPE, check_call

#-------------------------------------------------------------------------------
# Useful globals and utility functions
#-------------------------------------------------------------------------------

# A few handy globals
isfile = os.path.isfile
pjoin = os.path.join
repo_root = os.path.dirname(os.path.abspath(__file__))

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

name = 'jupyter_notebook'

# release.py contains version, authors, license, url, keywords, etc.
version_ns = {}
execfile(pjoin(repo_root, name, '_version.py'), version_ns)

version = version_ns['__version__']


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
    # This is not enough for these things to appear in an sdist.
    # We need to muck with the MANIFEST to get this to work
    
    # exclude components and less from the walk;
    # we will build the components separately
    excludes = [
        pjoin('static', 'components'),
        pjoin('static', '*', 'less'),
    ]

    # walk notebook resources:
    cwd = os.getcwd()
    os.chdir('jupyter_notebook')
    static_data = []
    for parent, dirs, files in os.walk('static'):
        if any(fnmatch(parent, pat) for pat in excludes):
            # prevent descending into subdirs
            dirs[:] = []
            continue
        for f in files:
            static_data.append(pjoin(parent, f))

    components = pjoin("static", "components")
    # select the components we actually need to install
    # (there are lots of resources we bundle for sdist-reasons that we don't actually use)
    static_data.extend([
        pjoin(components, "backbone", "backbone-min.js"),
        pjoin(components, "bootstrap", "js", "bootstrap.min.js"),
        pjoin(components, "bootstrap-tour", "build", "css", "bootstrap-tour.min.css"),
        pjoin(components, "bootstrap-tour", "build", "js", "bootstrap-tour.min.js"),
        pjoin(components, "es6-promise", "*.js"),
        pjoin(components, "font-awesome", "fonts", "*.*"),
        pjoin(components, "google-caja", "html-css-sanitizer-minified.js"),
        pjoin(components, "jquery", "jquery.min.js"),
        pjoin(components, "jquery-ui", "ui", "minified", "jquery-ui.min.js"),
        pjoin(components, "jquery-ui", "themes", "smoothness", "jquery-ui.min.css"),
        pjoin(components, "jquery-ui", "themes", "smoothness", "images", "*"),
        pjoin(components, "marked", "lib", "marked.js"),
        pjoin(components, "requirejs", "require.js"),
        pjoin(components, "underscore", "underscore-min.js"),
        pjoin(components, "moment", "moment.js"),
        pjoin(components, "moment", "min", "moment.min.js"),
        pjoin(components, "term.js", "src", "term.js"),
        pjoin(components, "text-encoding", "lib", "encoding.js"),
    ])

    # Ship all of Codemirror's CSS and JS
    for parent, dirs, files in os.walk(pjoin(components, 'codemirror')):
        for f in files:
            if f.endswith(('.js', '.css')):
                static_data.append(pjoin(parent, f))

    # Trim mathjax
    mj = lambda *path: pjoin(components, 'MathJax', *path)
    static_data.extend([
        mj('MathJax.js'),
        mj('config', 'TeX-AMS_HTML-full.js'),
        mj('jax', 'output', 'HTML-CSS', '*.js'),
    ])
    for tree in [
        mj('localization'), # limit to en?
        mj('fonts', 'HTML-CSS', 'STIX-Web', 'woff'),
        mj('jax', 'input', 'TeX'),
        mj('jax', 'output', 'HTML-CSS', 'autoload'),
        mj('jax', 'output', 'HTML-CSS', 'fonts', 'STIX-Web'),
    ]:
        for parent, dirs, files in os.walk(tree):
            for f in files:
                static_data.append(pjoin(parent, f))
    

    os.chdir(os.path.join('tests',))
    js_tests = glob('*.js') + glob('*/*.js')

    os.chdir(cwd)

    package_data = {
        'jupyter_notebook' : ['templates/*'] + static_data,
        'jupyter_notebook.tests' : js_tests,
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


static = pjoin(repo_root, 'jupyter_notebook', 'static')

npm_path = os.pathsep.join([
    pjoin(repo_root, 'node_modules', '.bin'),
    os.environ.get("PATH", os.defpath),
])

def mtime(path):
    """shorthand for mtime"""
    return os.stat(path).st_mtime

py3compat_ns = {}

class Bower(Command):
    description = "fetch static client-side components with bower"
    
    user_options = [
        ('force', 'f', "force fetching of bower dependencies"),
    ]
    
    def initialize_options(self):
        self.force = False
    
    def finalize_options(self):
        self.force = bool(self.force)
    
    bower_dir = pjoin(static, 'components')
    node_modules = pjoin(repo_root, 'node_modules')
    
    def should_run(self):
        if self.force:
            return True
        if not os.path.exists(self.bower_dir):
            return True
        return mtime(self.bower_dir) < mtime(pjoin(repo_root, 'bower.json'))

    def should_run_npm(self):
        if not which('npm'):
            print("npm unavailable", file=sys.stderr)
            return False
        if not os.path.exists(self.node_modules):
            return True
        return mtime(self.node_modules) < mtime(pjoin(repo_root, 'package.json'))
    
    def run(self):
        if not self.should_run():
            print("bower dependencies up to date")
            return
        
        if self.should_run_npm():
            print("installing build dependencies with npm")
            check_call(['npm', 'install'], cwd=repo_root)
            os.utime(self.node_modules, None)
        
        env = os.environ.copy()
        env['PATH'] = npm_path
        
        try:
            check_call(
                ['bower', 'install', '--allow-root', '--config.interactive=false'],
                cwd=repo_root,
                env=env,
            )
        except OSError as e:
            print("Failed to run bower: %s" % e, file=sys.stderr)
            print("You can install js dependencies with `npm install`", file=sys.stderr)
            raise
        os.utime(self.bower_dir, None)
        # update package data in case this created new files
        self.distribution.package_data = find_package_data()


class CompileCSS(Command):
    """Recompile Notebook CSS
    
    Regenerate the compiled CSS from LESS sources.
    
    Requires various dev dependencies, such as invoke and lessc.
    """
    description = "Recompile Notebook CSS"
    user_options = [
        ('force', 'f', "force recompilation of CSS"),
    ]
    
    def initialize_options(self):
        self.force = False
    
    def finalize_options(self):
        self.force = bool(self.force)
    
    def should_run(self):
        """Does less need to run?"""
        if self.force:
            return True
        
        css_targets = [pjoin(static, 'css', '%s.min.css' % name) for name in ('ipython', 'style')]
        css_maps = [t + '.map' for t in css_targets]
        targets = css_targets + css_maps
        if not all(os.path.exists(t) for t in targets):
            # some generated files don't exist
            return True
        earliest_target = sorted(mtime(t) for t in targets)[0]
    
        # check if any .less files are newer than the generated targets
        for (dirpath, dirnames, filenames) in os.walk(static):
            for f in filenames:
                if f.endswith('.less'):
                    path = pjoin(static, dirpath, f)
                    timestamp = mtime(path)
                    if timestamp > earliest_target:
                        return True
    
        return False
    
    def run(self):
        if not self.should_run():
            print("CSS up-to-date")
            return
        
        self.run_command('js')
        env = os.environ.copy()
        env['PATH'] = npm_path
        for name in ('ipython', 'style'):
            less = pjoin(static, 'style', '%s.less' % name)
            css = pjoin(static, 'style', '%s.min.css' % name)
            sourcemap = css + '.map'
            try:
                check_call([
                    'lessc', '--clean-css',
                    '--source-map-basepath={}'.format(static),
                    '--source-map={}'.format(sourcemap),
                    '--source-map-rootpath=../',
                    less, css,
                ], cwd=repo_root, env=env)
            except OSError as e:
                print("Failed to run lessc: %s" % e, file=sys.stderr)
                print("You can install js dependencies with `npm install`", file=sys.stderr)
                raise
        # update package data in case this created new files
        self.distribution.package_data = find_package_data()


class JavascriptVersion(Command):
    """write the javascript version to notebook javascript"""
    description = "Write IPython version to javascript"
    user_options = []
    
    def initialize_options(self):
        pass
    
    def finalize_options(self):
        pass
    
    def run(self):
        nsfile = pjoin(repo_root, "jupyter_notebook", "static", "base", "js", "namespace.js")
        with open(nsfile) as f:
            lines = f.readlines()
        with open(nsfile, 'w') as f:
            found = False
            for line in lines:
                if line.strip().startswith("IPython.version"):
                    line = '    IPython.version = "{0}";\n'.format(version)
                    found = True
                f.write(line)
            if not found:
                raise RuntimeError("Didn't find IPython.version line in %s" % nsfile)


def css_js_prerelease(command):
    """decorator for building js/minified css prior to another command"""
    class DecoratedCommand(command):
        def run(self):
            self.distribution.run_command('jsversion')
            js = self.distribution.get_command_obj('js')
            js.force = True
            css = self.distribution.get_command_obj('css')
            css.force = True
            try:
                self.distribution.run_command('css')
            except Exception as e:
                log.warn("rebuilding css and sourcemaps failed (not a problem)")
                log.warn(str(e))
            command.run(self)
    return DecoratedCommand
