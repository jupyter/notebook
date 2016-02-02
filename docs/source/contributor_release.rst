.. _notebook_release:

Making a notebook release
=========================

This document guides a contributor to create a release of the Jupyter
notebook.

Check installed tools
---------------------
Review :doc:`Installing Javascript machinery <development_js>`. Make sure all
the tools needed to generate the minified JavaScript and CSS files are
properly installed.

Clean the repository
--------------------
You can remove all non-tracked files with:

.. code::

    $ git clean -xfdi

This would ask you for confirmation before removing all untracked files. Make
sure the ``dist/`` folder is clean and avoid stale build from
previous attempts.

Steps to create a release
-------------------------

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

