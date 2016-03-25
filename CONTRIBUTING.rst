Contributing to the Jupyter Notebook
====================================

If you're reading this section, you're probably interested in contributing to
Jupyter.  Welcome and thanks for your interest in contributing!

Please take a look at the Contributor documentation, familiarize yourself with
using the Jupyter Notebook, and introduce yourself on the mailing list and share
what area of the project you are interested in working on.

General Guidelines
------------------

For general documentation about contributing to Jupyter projects, see the
`Project Jupyter Contributor Documentation`__.

__ http://jupyter.readthedocs.org/#contributor-documentation


Setting Up a Development Environment
------------------------------------

For general installation instructions have a look at the
`Project Jupyter Installation Guide`__.

__ https://jupyter.readthedocs.org/en/latest/install.html

Installing Node.js and npm
^^^^^^^^^^^^^^^^^^^^^^^^^^

Building the Notebook from its GitHub source code requires some tools to
create and minify JavaScript components and the CSS.
Namely, that's Node.js and Node's package manager, ``npm``.

If you use ``conda``, you can get them with::

    conda install -c javascript nodejs

If you use `Homebrew <http://brew.sh/>`_ on Mac OS X::

    brew install node

For Debian/Ubuntu systems, you should use the ``nodejs-legacy`` package instead
of the ``node`` package::

    sudo apt-get update
    sudo apt-get install nodejs-legacy npm

You can also use the installer from the `Node.js website <https://nodejs.org>`_.


Installing the Jupyter Notebook
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Once you have installed the dependencies mentioned above, use the following
steps::

    pip install setuptools pip --upgrade --user
    git clone https://github.com/jupyter/notebook
    cd notebook
    pip install -e . --user

If you want the development environment to be available for all users of your
system (assuming you have the necessary rights) or if you are installing in a
virtual environment, just drop the ``--user`` option.


Rebuilding JavaScript and CSS
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

There is a build step for the JavaScript and CSS in the notebook.
To make sure that you are working with up-to-date code, you will need to run
this command whenever there are changes to JavaScript or LESS sources::

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

Python Tests
^^^^^^^^^^^^

Install dependencies::

    pip install -e .[test] --user

To run the Python tests, use::

    nosetests

If you want coverage statistics as well, you can run::

    nosetests --with-coverage --cover-package=notebook notebook

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


Building the Documentation
--------------------------

To build the documentation you'll need `Sphinx <http://www.sphinx-doc.org/>`_
and a few other packages.

To install (and activate) a `conda environment`_ named ``notebook_docs``
containing all the necessary packages, use::

    conda env create -f docs/environment.yml
    source activate notebook_docs  # Linux and OS X
    activate notebook_docs         # Windows

.. _conda environment:
    http://conda.pydata.org/docs/using/envs.html#use-environment-from-file

If you want to install the necessary packages with ``pip`` instead, use
(omitting --user if working in a virtual environment)::

    pip install -r docs/doc-requirements.txt --user

Once you have installed the required packages, you can build the docs with::

    cd docs
    make html

After that, the generated HTML files will be available at
``build/html/index.html``. You may view the docs in your browser.

You can automatically check if all hyperlinks are still valid::

    make linkcheck

Windows users can find ``make.bat`` in the ``docs`` folder.

You should also have a look at the `Project Jupyter Documentation Guide`__.

__ https://jupyter.readthedocs.org/en/latest/contrib_guide_docs.html
