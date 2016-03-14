Contributing to the Jupyter Notebook
====================================

TODO: a welcoming sentence

General Guidelines
------------------

For general documentation about contributing to Jupyter projects, see the
`Project Jupyter Contributor Documentation`__.

__ http://jupyter.readthedocs.org/#contributor-documentation


Setting Up a Development Environment
------------------------------------

If you have already installed the dependencies mentioned below, the following
steps should get you going::

    pip install setuptools pip --upgrade --user
    git clone https://github.com/jupyter/notebook
    cd notebook
    pip install -e . --user

If you want this to be available for all users of your system (assuming you
have the necessary rights) or if you are running the commands in a virtualenv,
just drop the ``--user`` option.

Installing the Dependencies
^^^^^^^^^^^^^^^^^^^^^^^^^^^

Python Development Libraries
""""""""""""""""""""""""""""

On Debian/Ubuntu systems, you can get them with::

    sudo apt-get update
    sudo apt-get install python3-dev

The development libraries might be needed for the installation of *PyZMQ*,
*Tornado* and *Jinja2*.

Alternatively -- if you prefer -- you can also install those packages directly
with your package manager::

    sudo apt-get update
    sudo apt-get install python3-zmq python3-tornado python3-jinja2

Node.js and npm
"""""""""""""""

Building the Notebook from its GitHub source code requires some tools to
create and minify JavaScript components and the CSS.

You can use the pre-built installer from the `Node.js website`__.
The installer will include Node.js and Node's package manager, ``npm``.

__ https://nodejs.org

Or you can use your system's package manager ...

If you use homebrew on Mac OS X::

    brew install node

For Debian/Ubuntu systems, you need to use the ``nodejs-legacy`` package and
not the ``node`` package::

    sudo apt-get update
    sudo apt-get install nodejs-legacy npm


Rebuilding JavaScript and CSS
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

There is a build step for the JavaScript and CSS in the notebook.
You will need to run this command whenever there are changes to JavaScript or
LESS sources::

    python setup.py js css

Prototyping Tip
"""""""""""""""

When doing prototyping which needs quick iteration of the Notebook's
JavaScript, run this in the root of the repository::

    npm run build:watch

This will cause WebPack to monitor the files you edit and recompile them on the
fly.

Git Hooks
"""""""""

If you want to automatically update dependencies, recompile the JavaScript, and
recompile the CSS after checking out a new commit, you can install
post-checkout and post-merge hooks which will do it for you::

    git-hooks/install-hooks.sh

See ``git-hooks/README.md`` for more details.


Running Tests
-------------

JavaScript Tests
^^^^^^^^^^^^^^^^

To run the JavaScript tests, you will need to have PhantomJS and CasperJS
installed::

    npm install -g casperjs phantomjs@1.9.18

Then, to run the JavaScript tests::

    python -m notebook.jstest [group]

where ``[group]`` is an optional argument that is a path relative to
``notebook/tests/``.
For example, to run all tests in ``notebook/tests/notebook``::

    python -m notebook.jstest notebook

or to run just ``notebook/tests/notebook/deletecell.js``::

    python -m notebook.jstest notebook/deletecell.js

Python Tests
^^^^^^^^^^^^

Install dependencies::

    pip install -e .[test] --user

To run the Python tests, use::

    nosetests

If you want coverage statistics as well, you can run::

    nosetests --with-coverage --cover-package=notebook notebook

Building the Documentation
--------------------------

Install dependencies::

    pip install -e .[doc] --user

To build the HTML docs::

    cd docs
    make html

Windows users can find ``make.bat`` in the ``docs`` folder.

You should also have a look at the `Project Jupyter Documentation Guide`__.

__ https://jupyter.readthedocs.org/en/latest/contrib_guide_docs.html
