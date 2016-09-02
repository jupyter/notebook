.. _notebook_release:

Making a Notebook release
=========================

This document guides a contributor through creating a release of the Jupyter
notebook.

Check installed tools
---------------------

Review ``CONTRIBUTING.rst``. Make sure all the tools needed to generate the
minified JavaScript and CSS files are properly installed.

Clean the repository
--------------------

You can remove all non-tracked files with:

.. code:: bash

    git clean -xfdi

This would ask you for confirmation before removing all untracked files. Make
sure the ``dist/`` folder is clean and avoid stale build from
previous attempts.

Create the release
------------------

#.  Update version number in ``notebook/_version.py``.

#.  Run this command:

    .. code:: bash

        python setup.py jsversion

    It will modify (at least) ``notebook/static/base/js/namespace.js`` which
    makes the notebook version available from within JavaScript.

#.  Commit and tag the release with the current version number:

    .. code:: bash

        git commit -am "release $VERSION"
        git tag $VERSION

#.  You are now ready to build the ``sdist`` and ``wheel``:

    .. code:: bash

        python setup.py sdist
        python setup.py bdist_wheel

#.  You can now test the ``wheel`` and the ``sdist`` locally before uploading
    to PyPI. Make sure to use `twine <https://github.com/pypa/twine>`_ to
    upload the archives over SSL.

    .. code:: bash

        twine upload dist/*

#.  If all went well, change the ``notebook/_version.py`` back adding the
    ``.dev`` suffix.

#.  Push directly on master, not forgetting to push ``--tags`` too.
