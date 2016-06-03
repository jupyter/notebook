
`View the original notebook on nbviewer <http://nbviewer.jupyter.org/github/jupyter/notebook/blob/master/docs/source/examples/Notebook/Distributing%20Jupyter%20Extensions%20as%20Python%20Packages.ipynb>`__

Distributing Jupyter Extensions as Python Packages
==================================================

Overview
--------

How can the notebook be extended?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The Jupyter Notebook client and server application are both deeply
customizable. Their behavior can be extended by creating, respectively:

-  nbextension: a notebook extension

   -  a single JS file, or directory of JavaScript, Cascading
      StyleSheets, etc. that contain at minimum a JavaScript module
      packaged as an `AMD
      modules <https://en.wikipedia.org/wiki/Asynchronous_module_definition>`__
      that exports a function ``load_ipython_extension``

-  server extension: an importable Python module

   -  that implements ``load_jupyter_server_extension``

Why create a Python package for Jupyter extensions?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Since it is rare to have a server extension that does not have any
frontend components (an nbextension), for convenience and consistency,
all these client and server extensions with their assets can be packaged
and versioned together as a Python package with a few simple commands.
This makes installing the package of extensions easier and less
error-prone for the user.

Installation of Jupyter Extensions
----------------------------------

Install a Python package containing Jupyter Extensions
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

There are several ways that you may get a Python package containing
Jupyter Extensions. Commonly, you will use a package manager for your
system:

.. code:: shell

    pip install helpful_package
    # or
    conda install helpful_package
    # or
    apt-get install helpful_package

    # where 'helpful_package' is a Python package containing one or more Jupyter Extensions

Enable a Server Extension
~~~~~~~~~~~~~~~~~~~~~~~~~

The simplest case would be to enable a server extension which has no
frontend components.

A ``pip`` user that wants their configuration stored in their home
directory would type the following command:

.. code:: shell

    jupyter serverextension enable --py helpful_package

Alternatively, a ``virtualenv`` or ``conda`` user can pass
``--sys-prefix`` which keeps their environment isolated and
reproducible. For example:

.. code:: shell

    # Make sure that your virtualenv or conda environment is activated
    [source] activate my-environment

    jupyter serverextension enable --py helpful_package --sys-prefix

Install the nbextension assets
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If a package also has an nbextension with frontend assets that must be
available (but not neccessarily enabled by default), install these
assets with the following command:

.. code:: shell

    jupyter nbextension install --py helpful_package # or --sys-prefix if using virtualenv or conda

Enable nbextension assets
~~~~~~~~~~~~~~~~~~~~~~~~~

If a package has assets that should be loaded every time a Jupyter app
(e.g. lab, notebook, dashboard, terminal) is loaded in the browser, the
following command can be used to enable the nbextension:

.. code:: shell

    jupyter nbextension enable --py helpful_package # or --sys-prefix if using virtualenv or conda

Did it work? Check by listing Jupyter Extensions.
-------------------------------------------------

After running one or more extension installation steps, you can list
what is presently known about nbextensions or server extension. The
following commands will list which extensions are available, whether
they are enabled, and other extension details:

.. code:: shell

    jupyter nbextension list
    jupyter serverextension list

Additional resources on creating and distributing packages
----------------------------------------------------------

    Of course, in addition to the files listed, there are number of
    other files one needs to build a proper package. Here are some good
    resources: - `The Hitchhiker's Guide to
    Packaging <http://the-hitchhikers-guide-to-packaging.readthedocs.org/en/latest/quickstart.html>`__
    - `Repository Structure and
    Python <http://www.kennethreitz.org/essays/repository-structure-and-python>`__
    by Kenneth Reitz

    How you distribute them, too, is important: - `Packaging and
    Distributing
    Projects <http://python-packaging-user-guide.readthedocs.org/en/latest/distributing/>`__
    - `conda: Building
    packages <http://conda.pydata.org/docs/building/build.html>`__

    Here are some tools to get you started: -
    `generator-nbextension <https://github.com/Anaconda-Server/generator-nbextension>`__

Example - Server extension
--------------------------

Creating a Python package with a server extension
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Here is an example of a python module which contains a server extension
directly on itself. It has this directory structure:

::

    - setup.py
    - MANIFEST.in
    - my_module/
      - __init__.py

Defining the server extension
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

This example shows that the server extension and its
``load_jupyter_server_extension`` function are defined in the
``__init__.py`` file.

``my_module/__init__.py``
^^^^^^^^^^^^^^^^^^^^^^^^^

.. code:: python

    def _jupyter_server_extension_paths():
        return [{
            "module": "my_module"
        }]


    def load_jupyter_server_extension(nbapp):
        nbapp.log.info("my module enabled!")

Install and enable the server extension
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Which a user can install with:

::

    jupyter serverextension enable --py my_module [--sys-prefix]

Example - Server extension and nbextension
------------------------------------------

Creating a Python package with a server extension and nbextension
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Here is another server extension, with a front-end module. It assumes
this directory structure:

::

    - setup.py
    - MANIFEST.in
    - my_fancy_module/
      - __init__.py
      - static/
        index.js

Defining the server extension and nbextension
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

This example again shows that the server extension and its
``load_jupyter_server_extension`` function are defined in the
``__init__.py`` file. This time, there is also a function
``_jupyter_nbextension_path`` for the nbextension.

``my_fancy_module/__init__.py``
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code:: python

    def _jupyter_server_extension_paths():
        return [{
            "module": "my_fancy_module"
        }]

    # Jupyter Extension points
    def _jupyter_nbextension_paths():
        return [dict(
            section="notebook",
            # the path is relative to the `my_fancy_module` directory
            src="static",
            # directory in the `nbextension/` namespace
            dest="my_fancy_module",
            # _also_ in the `nbextension/` namespace
            require="my_fancy_module/index")]

    def load_jupyter_server_extension(nbapp):
        nbapp.log.info("my module enabled!")

Install and enable the server extension and nbextension
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The user can install and enable the extensions with the following set of
commands:

::

    jupyter nbextension install --py my_fancy_module [--sys-prefix|--user]
    jupyter nbextension enable --py my_fancy_module [--sys-prefix|--system]
    jupyter serverextension enable --py my_fancy_module [--sys-prefix|--system]

`View the original notebook on nbviewer <http://nbviewer.jupyter.org/github/jupyter/notebook/blob/master/docs/source/examples/Notebook/Distributing%20Jupyter%20Extensions%20as%20Python%20Packages.ipynb>`__
