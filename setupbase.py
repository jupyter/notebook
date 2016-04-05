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

import pipes
from distutils import log
from distutils.cmd import Command
from fnmatch import fnmatch
from glob import glob
from multiprocessing.pool import ThreadPool
from subprocess import check_call, check_output

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
        pjoin('static', '*', 'node_modules')
    ]

    # walk notebook resources:
    cwd = os.getcwd()
    os.chdir('notebook')
    static_data = []
    for parent, dirs, files in os.walk('static'):
        if any(fnmatch(parent, pat) for pat in excludes):
            # prevent descending into subdirs
            dirs[:] = []
            continue
        for f in files:
            static_data.append(pjoin(parent, f))
    
    # for verification purposes, explicitly add main.min.js
    # so that installation will fail if they are missing
    for app in ['auth', 'edit', 'notebook', 'terminal', 'tree']:
        static_data.extend([
            pjoin('static', app, 'js', 'built', '*main.min.js'),
            pjoin('static', app, 'js', 'built', '*main.min.js.map'),
        ])
    static_data.extend([
        pjoin('static', 'built', '*index.js'),
        pjoin('static', 'built', '*index.js.map'),
        pjoin('static', 'services', 'built', '*contents.js'),
        pjoin('static', 'services', 'built', '*contents.js.map'),
    ])
    
    # Add the Lab page contents
    static_data.append(pjoin('lab', 'build', '*'))

    components = pjoin("static", "components")
    # select the components we actually need to install
    # (there are lots of resources we bundle for sdist-reasons that we don't actually use)
    static_data.extend([
        pjoin(components, "backbone", "backbone-min.js"),
        pjoin(components, "bootstrap", "js", "bootstrap.min.js"),
        pjoin(components, "bootstrap-tour", "build", "css", "bootstrap-tour.min.css"),
        pjoin(components, "bootstrap-tour", "build", "js", "bootstrap-tour.min.js"),
        pjoin(components, "es6-promise", "*.js"),
        pjoin(components, "font-awesome", "css", "*.css"),
        pjoin(components, "font-awesome", "fonts", "*.*"),
        pjoin(components, "google-caja", "html-css-sanitizer-minified.js"),
        pjoin(components, "jquery", "jquery.min.js"),
        pjoin(components, "jquery-typeahead", "dist", "jquery.typeahead.min.js"),
        pjoin(components, "jquery-typeahead", "dist", "jquery.typeahead.min.css"),
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
        mj('config', 'Safe.js'),
    ])
    
    trees = []
    mj_out = mj('jax', 'output')
    
    if os.path.exists(mj_out):
        for output in os.listdir(mj_out):
            path = pjoin(mj_out, output)
            static_data.append(pjoin(path, '*.js'))
            autoload = pjoin(path, 'autoload')
            if os.path.isdir(autoload):
                trees.append(autoload)

    for tree in trees + [
        mj('localization'), # limit to en?
        mj('fonts', 'HTML-CSS', 'STIX-Web', 'woff'),
        mj('extensions'),
        mj('jax', 'input', 'TeX'),
        mj('jax', 'output', 'HTML-CSS', 'fonts', 'STIX-Web'),
        mj('jax', 'output', 'SVG', 'fonts', 'STIX-Web'),
    ]:
        for parent, dirs, files in os.walk(tree):
            for f in files:
                static_data.append(pjoin(parent, f))

    os.chdir(os.path.join('tests',))
    js_tests = glob('*.js') + glob('*/*.js')

    os.chdir(cwd)

    package_data = {
        'notebook' : ['templates/*'] + static_data,
        'notebook.tests' : js_tests,
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

npm_path = os.pathsep.join([
    pjoin(repo_root, 'node_modules', '.bin'),
    os.environ.get("PATH", os.defpath),
])

def mtime(path):
    """shorthand for mtime"""
    return os.stat(path).st_mtime


def run(cmd, *args, **kwargs):
    """Echo a command before running it"""
    log.info('> ' + list2cmdline(cmd))
    kwargs['shell'] = (sys.platform == 'win32')
    return check_call(cmd, *args, **kwargs)


class JavascriptDependencies(Command):
    description = "Fetch Javascript dependencies with npm and bower"
    
    def initialize_options(self):
        pass
    
    def finalize_options(self):
        pass
    
    bower_dir = pjoin(static, 'components')
    node_modules = pjoin(repo_root, 'node_modules')
    lab_dir = pjoin(repo_root, 'notebook', 'lab')
    
    def run(self):
        try:
            run(['npm', 'install', '--progress=false'], cwd=repo_root)
        except OSError as e:
            print("Failed to run `npm install`: %s" % e, file=sys.stderr)
            print("npm is required to build a development version of the notebook.", file=sys.stderr)
            raise
        
        try:
            run(['npm', 'run', 'bower'], cwd=repo_root)
        except Exception as e:
            print("Failed to run `npm run bower`: %s" % e, file=sys.stderr)
            print("You can install js dependencies with `npm install`", file=sys.stderr)
            raise

        try:
            run(['npm', 'install', '--progress=false'], cwd=self.lab_dir)
            run(['npm', 'run', 'build'], cwd=self.lab_dir)
        except Exception as e:
            print("Failed to run `npm install`: %s" % e, file=sys.stderr)
            print("You can install js dependencies with `npm install`", file=sys.stderr)
            raise

        # update package data in case this created new files
        update_package_data(self.distribution)


class CompileCSS(Command):
    """Recompile Notebook CSS
    
    Regenerate the compiled CSS from LESS sources.
    
    Requires various dev dependencies, such as require and lessc.
    """
    description = "Recompile Notebook CSS"
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    sources = []
    targets = []
    for name in ('ipython', 'style'):
        sources.append(pjoin(static, 'style', '%s.less' % name))
        targets.append(pjoin(static, 'style', '%s.min.css' % name))

    def run(self):
        self.run_command('jsdeps')
        env = os.environ.copy()
        env['PATH'] = npm_path
        
        for src, dst in zip(self.sources, self.targets):
            try:
                run(['lessc',
                    '--source-map',
                    '--include-path=%s' % pipes.quote(static),
                    src,
                    dst,
                ], cwd=repo_root, env=env)
            except OSError as e:
                print("Failed to build css: %s" % e, file=sys.stderr)
                print("You can install js dependencies with `npm install`", file=sys.stderr)
                raise
        # update package data in case this created new files
        update_package_data(self.distribution)


class CompileJS(Command):
    """Rebuild Notebook Javascript main.min.js files
    
    Calls require via build-main.js
    """
    description = "Rebuild Notebook Javascript main.min.js files"
    user_options = [
        ('force', 'f', "force rebuilding js targets"),
    ]

    def initialize_options(self):
        self.force = False

    def finalize_options(self):
        self.force = bool(self.force)

    target = pjoin(static, 'built', 'index.js')
    targets = [target]
    
    def sources(self):
        """Generator yielding .js sources that an application depends on"""
        yield pjoin(repo_root, 'package.json')
        yield pjoin(repo_root, 'webpack.config.js')
        for parent, dirs, files in os.walk(static):
            if os.path.basename(parent) in {'MathJax', 'built'}:
                # don't look in MathJax, since it takes forever to walk it
                # also don't look at build targets as sources
                dirs[:] = []
                continue
            for f in files:
                if not f.endswith('.js'):
                    continue
                yield pjoin(parent, f)
    
    def should_run(self):
        if self.force or not os.path.exists(self.target):
            print("Missing %s" % self.target)
            return True
        target_mtime = mtime(self.target)
        for source in self.sources():
            if mtime(source) > target_mtime:
                print('%s > %s' % (source, self.target))
                return True
        return False

    def run(self):
        self.run_command('jsdeps')
        if self.should_run():
            run(['npm', 'run', 'build:js'])
        # update package data in case this created new files
        update_package_data(self.distribution)


class JavascriptVersion(Command):
    """write the javascript version to notebook javascript"""
    description = "Write Jupyter version to javascript"
    user_options = []
    
    def initialize_options(self):
        pass
    
    def finalize_options(self):
        pass
    
    def run(self):
        nsfile = pjoin(repo_root, "notebook", "static", "base", "js", "namespace.js")
        lines = []
        found = False
        with open(nsfile) as f:
            for line in f.readlines():
                if line.strip().startswith("Jupyter.version"):
                    found = True
                    new_line = '    Jupyter.version = "{0}";\n'.format(version)
                    if new_line == line:
                        # no change, don't rewrite file
                        return
                    lines.append(new_line)
                else:
                    lines.append(line)

        if not found:
            raise RuntimeError("Didn't find Jupyter.version line in %s" % nsfile)
        
        print("Writing version=%s to %s" % (version, nsfile))
        with open(nsfile, 'w') as f:
            for line in lines:
                f.write(line)


def css_js_prerelease(command, strict=False):
    """decorator for building minified js/css prior to another command"""
    class DecoratedCommand(command):
        def run(self):
            self.distribution.run_command('jsversion')
            jsdeps = self.distribution.get_command_obj('jsdeps')
            js = self.distribution.get_command_obj('js')
            css = self.distribution.get_command_obj('css')

            js.force = strict

            targets = [ jsdeps.bower_dir ]
            targets.extend(js.targets)
            targets.extend(css.targets)
            missing = [ t for t in targets if not os.path.exists(t) ]

            if not is_repo and not missing:
                # If we're an sdist, we aren't a repo and everything should be present.
                # Don't rebuild js/css in that case.
                command.run(self)
                return

            try:
                self.distribution.run_command('css')
                self.distribution.run_command('js')
            except Exception as e:
                # refresh missing
                missing = [ t for t in targets if not os.path.exists(t) ]
                if strict or missing:
                    # die if strict or any targets didn't build
                    prefix = os.path.commonprefix([repo_root + os.sep] + missing)
                    missing = [ m[len(prefix):] for m in missing ]
                    log.warn("rebuilding js and css failed. The following required files are missing: %s" % missing)
                    raise e
                else:
                    log.warn("rebuilding js and css failed (not a problem)")
                    log.warn(str(e))

            # check again for missing targets, just in case:
            missing = [ t for t in targets if not os.path.exists(t) ]
            if missing:
                # command succeeded, but targets still missing (?!)
                prefix = os.path.commonprefix([repo_root + os.sep] + missing)
                missing = [ m[len(prefix):] for m in missing ]
                raise ValueError("The following required files are missing: %s" % missing)

            command.run(self)
    return DecoratedCommand
