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
