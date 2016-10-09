#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Setup script for Jupyter Notebook"""

#-----------------------------------------------------------------------------
#  Copyright (c) 2015-, Jupyter Development Team.
#  Copyright (c) 2008-2015, IPython Development Team.
#
#  Distributed under the terms of the Modified BSD License.
#
#  The full license is in the file COPYING.md, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import print_function

name = "notebook"

#-----------------------------------------------------------------------------
# Minimal Python version sanity check
#-----------------------------------------------------------------------------

import sys

v = sys.version_info
if v[:2] < (2,7) or (v[0] >= 3 and v[:2] < (3,3)):
    error = "ERROR: %s requires Python version 2.7 or 3.3 or above." % name
    print(error, file=sys.stderr)
    sys.exit(1)

PY3 = (sys.version_info[0] >= 3)

# At least we're on the python version we need, move on.


#-------------------------------------------------------------------------------
# Imports
#-------------------------------------------------------------------------------

import os

from glob import glob

# BEFORE importing distutils, remove MANIFEST. distutils doesn't properly
# update it when the contents of directories change.
if os.path.exists('MANIFEST'): os.remove('MANIFEST')

from distutils.core import setup

# Our own imports

from setupbase import (
    version,
    find_packages,
    find_package_data,
    check_package_data_first,
    CompileCSS,
    CompileJS,
    Bower,
    JavascriptVersion,
    css_js_prerelease,
)

isfile = os.path.isfile
pjoin = os.path.join

setup_args = dict(
    name            = name,
    description     = "A web-based notebook environment for interactive computing",
    long_description = """
The Jupyter Notebook is a web application that allows you to create and
share documents that contain live code, equations, visualizations, and
explanatory text. The Notebook has support for multiple programming
languages, sharing, and interactive widgets.

Read `the documentation <https://jupyter-notebook.readthedocs.io>`_
for more information.
    """,
    version         = version,
    scripts         = glob(pjoin('scripts', '*')),
    packages        = find_packages(),
    package_data     = find_package_data(),
    author          = 'Jupyter Development Team',
    author_email    = 'jupyter@googlegroups.com',
    url             = 'http://jupyter.org',
    license         = 'BSD',
    platforms       = "Linux, Mac OS X, Windows",
    keywords        = ['Interactive', 'Interpreter', 'Shell', 'Web'],
    classifiers     = [
        'Intended Audience :: Developers',
        'Intended Audience :: System Administrators',
        'Intended Audience :: Science/Research',
        'License :: OSI Approved :: BSD License',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2.7',
        'Programming Language :: Python :: 3',
    ],
)



#---------------------------------------------------------------------------
# Find all the packages, package data, and data_files
#---------------------------------------------------------------------------

packages = find_packages()
package_data = find_package_data()

#---------------------------------------------------------------------------
# custom distutils commands
#---------------------------------------------------------------------------
# imports here, so they are after setuptools import if there was one
from distutils.command.build_py import build_py
from distutils.command.sdist import sdist


setup_args['cmdclass'] = {
    'build_py': css_js_prerelease(
            check_package_data_first(build_py)),
    'sdist' : css_js_prerelease(sdist, strict=True),
    'css' : CompileCSS,
    'js' : CompileJS,
    'jsdeps' : Bower,
    'jsversion' : JavascriptVersion,
}



#---------------------------------------------------------------------------
# Handle scripts, dependencies, and setuptools specific things
#---------------------------------------------------------------------------

if any(arg.startswith('bdist') for arg in sys.argv):
    import setuptools

# This dict is used for passing extra arguments that are setuptools
# specific to setup
setuptools_extra_args = {}

# setuptools requirements

pyzmq = 'pyzmq>=13'

setup_args['scripts'] = glob(pjoin('scripts', '*'))

install_requires = [
    'jinja2',
    'tornado>=4',
    'ipython_genutils',
    'traitlets',
    'jupyter_core',
    'jupyter_client',
    'nbformat',
    'nbconvert',
    'ipykernel', # bless IPython kernel for now
]
extras_require = {
    ':sys_platform != "win32"': ['terminado>=0.3.3'],
    'doc': ['Sphinx>=1.1'],
    'test:python_version == "2.7"': ['mock'],
    'test': ['nose', 'requests'],
}

if 'setuptools' in sys.modules:
    # setup.py develop should check for submodules
    from setuptools.command.develop import develop
    setup_args['cmdclass']['develop'] = css_js_prerelease(develop)

    try:
        from wheel.bdist_wheel import bdist_wheel
    except ImportError:
        pass
    else:
        setup_args['cmdclass']['bdist_wheel'] = css_js_prerelease(bdist_wheel)

    setuptools_extra_args['zip_safe'] = False
    setup_args['extras_require'] = extras_require
    requires = setup_args['install_requires'] = install_requires

    setup_args['entry_points'] = {
        'console_scripts': [
            'jupyter-notebook = notebook.notebookapp:main',
            'jupyter-nbextension = notebook.nbextensions:main',
            'jupyter-serverextension = notebook.serverextensions:main',
        ]
    }
    setup_args.pop('scripts', None)

#---------------------------------------------------------------------------
# Do the actual setup now
#---------------------------------------------------------------------------

setup_args.update(setuptools_extra_args)

def main():
    setup(**setup_args)

if __name__ == '__main__':
    main()
