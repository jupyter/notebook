.. _development_js:

Installing Javascript machinery
===============================

Running the Notebook from the source code on GitHub requires some JavaScript
tools to build/minify the CSS and JavaScript components. We do these steps when
making releases, so there's no need for these tools when installing released
versions of the Notebook.

First, install `Node.js <https://nodejs.org/>`_. The installers on the
Node.js website also include Node's package manager, *npm*. Alternatively,
install both of these from your package manager. For example, on Ubuntu or Debian::

    sudo apt-get install nodejs-legacy npm

You can then build the JavaScript and CSS by running::

    python setup.py css js

This will automatically fetch the remaining dependencies (bower, less) and
install them in a subdirectory.

For quick iteration on the Notebook's JavaScript you can deactivate the use of
the bundled and minified JavaScript by using the option
``--NotebookApp.ignore_minified_js=True``.  This might though highly increase the
number of requests that the browser make to the server, but can allow to test
JavaScript file modification without going through the compilation step that
can take up to 30 sec.


Making a notebook release
-------------------------

Make sure you have followed the step above and have all the tools to generate
the minified JavaScript and CSS files. 

Make sure the repository is clean of any file that could be problematic. 
You can remove all non-tracked files with:

.. code::

    $ git clean -xfdi

This would ask you for confirmation before removing all untracked files. Make
sure the ``dist/`` folder is clean and avoid stale build from
previous attempts.

1. Update version number in ``notebook/_version.py``.

2. Run ``$ python setup.py jsversion``. It will modify (at least)
``notebook/static/base/js/namespace.js`` to make the notebook version available
from within JavaScript.

3 . Commit and tag the release with the current version number:

.. code::

    git commit -am "release $VERSION"
    git tag $VERSION


4. You are now ready to build the ``sdist`` and ``wheel``:

.. code::

    $ python setup.py sdist --formats=zip,gztar
    $ python setup.py bdist_wheel


5. You can now test the ``wheel`` and the ``sdist`` locally before uploading to PyPI.
Make sure to use `twine <https://github.com/pypa/twine>`_ to upload the archives over SSL.

.. code::

    $ twine upload dist/*

6. If all went well, change the ``notebook/_version.py`` back adding the ``.dev`` suffix.

7. Push directly on master, not forgetting to push ``--tags``.

