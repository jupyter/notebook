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
from subprocess import Popen, PIPE

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
# VCS related
#---------------------------------------------------------------------------

# utils.submodule has checks for submodule status
submodule = {}
execfile(pjoin('jupyter_notebook','submodule.py'), submodule)
check_submodule_status = submodule['check_submodule_status']
update_submodules = submodule['update_submodules']

class UpdateSubmodules(Command):
    """Update git submodules
    
    The Notebook's external javascript dependencies live in a separate repo.
    """
    description = "Update git submodules"
    user_options = []
    
    def initialize_options(self):
        pass
    
    def finalize_options(self):
        pass
    
    def run(self):
        try:
            self.spawn('git submodule init'.split())
            self.spawn('git submodule update --recursive'.split())
        except Exception as e:
            print(e)
        
        if not check_submodule_status(repo_root) == 'clean':
            print("submodules could not be checked out")
            sys.exit(1)


def require_submodules(command):
    """decorator for instructing a command to check for submodules before running"""
    class DecoratedCommand(command):
        def run(self):
            if not check_submodule_status(repo_root) == 'clean':
                print("submodules missing! Run `setup.py submodule` and try again")
                sys.exit(1)
            command.run(self)
    return DecoratedCommand

#---------------------------------------------------------------------------
# Notebook related
#---------------------------------------------------------------------------

class CompileCSS(Command):
    """Recompile Notebook CSS
    
    Regenerate the compiled CSS from LESS sources.
    
    Requires various dev dependencies, such as invoke and lessc.
    """
    description = "Recompile Notebook CSS"
    user_options = [
        ('minify', 'x', "minify CSS"),
        ('force', 'f', "force recompilation of CSS"),
    ]
    
    def initialize_options(self):
        self.minify = False
        self.force = False
    
    def finalize_options(self):
        self.minify = bool(self.minify)
        self.force = bool(self.force)
    
    def run(self):
        cmd = ['invoke', 'css']
        if self.minify:
            cmd.append('--minify')
        if self.force:
            cmd.append('--force')
        try:
            p = Popen(cmd, cwd=pjoin(repo_root, "jupyter_notebook"), stderr=PIPE)
        except OSError:
            raise DistutilsExecError("invoke is required to rebuild css (pip install invoke)")
        out, err = p.communicate()
        if p.returncode:
            if sys.version_info[0] >= 3:
                err = err.decode('utf8', 'replace')
            raise DistutilsExecError(err.strip())


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
    """decorator for building js/minified css prior to a release"""
    class DecoratedCommand(command):
        def run(self):
            self.distribution.run_command('jsversion')
            css = self.distribution.get_command_obj('css')
            css.minify = True
            try:
                self.distribution.run_command('css')
            except Exception as e:
                log.warn("rebuilding css and sourcemaps failed (not a problem)")
                log.warn(str(e))
            command.run(self)
    return DecoratedCommand
