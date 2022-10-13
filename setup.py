#!/usr/bin/env python
"""Setup script for Jupyter Notebook"""

#-----------------------------------------------------------------------------
#  Copyright (c) 2015-, Jupyter Development Team.
#  Copyright (c) 2008-2015, IPython Development Team.
#
#  Distributed under the terms of the Modified BSD License.
#
#  The full license is in the file LICENSE, distributed with this software.
#-----------------------------------------------------------------------------

import os
import sys

name = "notebook"

if sys.version_info < (3, 6):
    pip_message = 'This may be due to an out of date pip. Make sure you have pip >= 9.0.1.'
    try:
        import pip
        pip_version = tuple(int(x) for x in pip.__version__.split('.')[:3])
        if pip_version < (9, 0, 1) :
            pip_message = 'Your pip version is out of date, please install pip >= 9.0.1. '\
            'pip {} detected.'.format(pip.__version__)
        else:
            # pip is new enough - it must be something else
            pip_message = ''
    except Exception:
        pass


    error = """
Notebook 6.3+ supports Python 3.6 and above.
When using Python 3.5, please install Notebook <= 6.2.
When using Python 3.4 or earlier (including 2.7), please install Notebook 5.x.

Python {py} detected.
{pip}
""".format(py=sys.version_info, pip=pip_message )

    print(error, file=sys.stderr)
    sys.exit(1)

# At least we're on the python version we need, move on.

# BEFORE importing distutils, remove MANIFEST. distutils doesn't properly
# update it when the contents of directories change.
if os.path.exists('MANIFEST'): os.remove('MANIFEST')

from setuptools import setup

# Needed to support building with `setuptools.build_meta`
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from setupbase import (
    version,
    find_packages,
    find_package_data,
    check_package_data_first,
    CompileBackendTranslation,
)


data_files = [
    ('share/applications', ['jupyter-notebook.desktop']),
    ('share/icons/hicolor/scalable/apps', ['notebook.svg']),
 ]


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
    long_description_content_type = 'text/markdown',
    version         = version,
    packages        = find_packages(),
    package_data    = find_package_data(),
    data_files      = data_files,
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
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
    ],
    zip_safe = False,
    install_requires = [
        'jinja2',
        'tornado>=6.1',
        # pyzmq>=17 is not technically necessary,
        # but hopefully avoids incompatibilities with Tornado 5. April 2018
        'pyzmq>=17',
        'argon2-cffi',
        'traitlets>=4.2.1',
        'jupyter_core>=4.6.1',
        'jupyter_client>=5.3.4',
        'ipython_genutils',
        'nbformat',
        'nbconvert>=5',
        'nest-asyncio>=1.5',
        'ipykernel', # bless IPython kernel for now
        'Send2Trash>=1.8.0',
        'terminado>=0.8.3',
        'prometheus_client',
        'nbclassic==0.4.5',
    ],
    extras_require = {
        'test': ['pytest', 'coverage', 'requests', 'testpath',
                 'nbval', 'selenium==4.1.5', 'pytest', 'pytest-cov'],
        'docs': ['sphinx', 'nbsphinx', 'sphinxcontrib_github_alt',
                 'sphinx_rtd_theme', 'myst-parser'],
        'test:sys_platform != "win32"': ['requests-unixsocket'],
        'json-logging': ['json-logging']
    },
    python_requires = '>=3.7',
    entry_points = {
        'console_scripts': [
            'jupyter-notebook = notebook.notebookapp:main',
            'jupyter-nbextension = notebook.nbextensions:main',
            'jupyter-serverextension = notebook.serverextensions:main',
            'jupyter-bundlerextension = notebook.bundler.bundlerextensions:main',
        ]
    },
)

# Custom distutils/setuptools commands ----------
from distutils.command.build_py import build_py
from distutils.command.sdist import sdist
from setuptools.command.bdist_egg import bdist_egg
from setuptools.command.develop import develop

class bdist_egg_disabled(bdist_egg):
    """Disabled version of bdist_egg

    Prevents setup.py install from performing setuptools' default easy_install,
    which it should never ever do.
    """
    def run(self):
        sys.exit("Aborting implicit building of eggs. Use `pip install .` to install from source.")

setup_args['cmdclass'] = {
    'build_py': check_package_data_first(build_py),
    'sdist' : sdist,
    'develop': develop,
    'backendtranslations': CompileBackendTranslation,
    'bdist_egg': bdist_egg if 'bdist_egg' in sys.argv else bdist_egg_disabled,
}

try:
    from wheel.bdist_wheel import bdist_wheel
except ImportError:
    pass
# else:
#     setup_args['cmdclass']['bdist_wheel'] = css_js_prerelease(bdist_wheel)

# Run setup --------------------
def main():
    setup(**setup_args)

if __name__ == '__main__':
    main()
