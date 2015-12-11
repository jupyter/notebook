.. _development_js:

Installing Javascript machinery
===============================

Running the Notebook from the source code on Github requires some Javascript
tools to build/minify the CSS and Javascript components. We do these steps when
making releases, so there's no need for these tools when installing released
versions of the Notebook.

First, install `Node.js <https://nodejs.org/>`_. The installers on the
Node.js website also include Node's package manager, *npm*. Alternatively,
install both of these from your package manager. For example, on Ubuntu or Debian::

    sudo apt-get install nodejs-legacy npm

You can then build the Javascript and CSS by running::

    python setup.py css js

This will automatically fetch the remaining dependencies (bower, less) and
install them in a subdirectory.

For quick iteration on the Notebook's Javascript you can deactivate the use of
the bundled and minified Javacript by using the option
``--NotebookApp.ignore_minified_js=True``.  This might though highly increase the
number of requests that the browser make to the server, but can allow to test
Javascript file modification without going through the compilation step that
can take up to 30 sec.


Making a notebook release
-------------------------

Make sure you have followed the step above and have all the tools to genereate
the minified javascript and css files. 

Make sure the repository is clean of any file that could be problematic. 
You can remove all non-tracked files with:

.. code::

    $ git clean -xfdi

This would ask you for confirmation before removing all untracked file. Make
sure the ``dist/`` folder in particular is clean and avoid stale build from
previous attempts.

Run the following two commands to generate the universal ``wheel`` and the ``sdist``:

.. code::

    $ python setup.py sdist
    $ python setup.py bdist_wheel

.. note::

    The above command will modify (at least) the following file :
    ``notebook/static/base/js/namespace.js`` to make the notebook version
    availlable from javascript.


You can now test the ``wheel`` and the ``sdist`` locally before uploading to PyPI.
Make sure to use twine to upload the archives over SSL.

.. code::

    $ twine upload dist/*

