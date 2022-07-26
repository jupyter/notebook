Contributing to the Jupyter Notebook
====================================

If you're reading this section, you're probably interested in contributing to
Jupyter.  Welcome and thanks for your interest in contributing!

Please take a look at the Contributor documentation, familiarize yourself with
using the Jupyter Notebook, and introduce yourself on the mailing list and
share what area of the project you are interested in working on.

General Guidelines
------------------

For general documentation about contributing to Jupyter projects, see the
`Project Jupyter Contributor Documentation`__.

__ https://jupyter.readthedocs.io/en/latest/contributing/content-contributor.html


Setting Up a Development Environment
------------------------------------

Installing the Jupyter Notebook
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Use the following steps::

    pip install --upgrade setuptools pip
    git clone https://github.com/jupyter/notebook
    cd notebook
    pip install -e .

If you are using a system-wide Python installation and you only want to install the notebook for you,
you can add ``--user`` to the install commands.

Once you have done this, you can launch the master branch of Jupyter notebook
from any directory in your system with::

    jupyter notebook

Verification
^^^^^^^^^^^^

While running the notebook, select one of your notebook files (the file will have the extension ``.ipynb``).
In the top tab you will click on "Help" and then click on "About". In the pop window you will see information about the version of Jupyter that you are running. You will see "The version of the notebook server is:".
If you are working in development mode, you will see that your version of Jupyter notebook will include the word "dev". If it does not include the word "dev", you are currently not working in development mode and should follow the steps below to uninstall and reinstall Jupyter.

Troubleshooting the Installation
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

If you do not see that your Jupyter Notebook is running on dev mode, it's possible that you are
running other instances of Jupyter Notebook. You can try the following steps:

1. Uninstall all instances of the notebook package. These include any installations you made using
   pip or conda.
2. Run ``python3 -m pip install -e .`` in the notebook repository to install the notebook from there.
3. Launch with ``python3 -m notebook --port 8989``, and check that the browser is pointing to ``localhost:8989``
   (rather than the default 8888). You don't necessarily have to launch with port 8989, as long as you use
   a port that is neither the default nor in use, then it should be fine.
4. Verify the installation with the steps in the previous section.

If you have tried the above and still find that the notebook is not reflecting the current source code,
try cleaning the repo with ``git clean -xfd`` and reinstalling with ``pip install -e .``.


Modifying the JavaScript and CSS
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The build process for this version of notebook grabs the static assets
from the nbclassic package. Frontend changes should be made in the `nbclassic repository`_.

.. _nbclassic repository: https://github.com/jupyter/nbclassic


Running Tests
-------------

Python Tests
^^^^^^^^^^^^

Install dependencies::

    pip install -e '.[test]'

To run the Python tests, use::

    pytest

If you want coverage statistics as well, you can run::

    py.test --cov notebook -v --pyargs notebook



Building the Documentation
--------------------------

To build the documentation you'll need `Sphinx <http://www.sphinx-doc.org/>`_,
`pandoc <http://pandoc.org/>`_ and a few other packages.

To install (and activate) a conda environment named ``notebook_docs``
containing all the necessary packages (except pandoc), use::

    conda create -n notebook_docs pip
    conda activate notebook_docs  # Linux and OS X
    activate notebook_docs        # Windows
    pip install .[docs]

If you want to install the necessary packages with ``pip``, use the following instead::

    pip install .[docs]

Once you have installed the required packages, you can build the docs with::

    cd docs
    make html

After that, the generated HTML files will be available at
``build/html/index.html``. You may view the docs in your browser.

You can automatically check if all hyperlinks are still valid::

    make linkcheck

Windows users can find ``make.bat`` in the ``docs`` folder.

You should also have a look at the `Project Jupyter Documentation Guide`__.

__ https://jupyter.readthedocs.io/en/latest/contributing/docs-contributions/index.html
