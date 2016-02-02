.. _development_js:

Installing JavaScript machinery
===============================

.. note::

    This section is prepared for contributors to the Notebook source code.
    Users of the released Notebook do not need to install the JavaScript
    tools.

Building the Notebook from its GitHub source code requires some tools to
create JavaScript components and minify the CSS. These tools and the
following steps are used when making a Notebook release.

1. Install `Node.js <https://nodejs.org/>`_ and `npm`.

   - *Using the installers on Node.js website*: Select a pre-built installer
     on the Node.js website. The installer will include `Node.js` and
     Node's package manager, `npm`.

   - *Using system's package manager*: Install `node.js` and `npm` using the 
     system's package manager. For example, the command for Ubuntu or Debian
     is:

     .. code:: bash

         sudo apt-get install nodejs-legacy npm

2. Build the JavaScript and CSS by running::

    python setup.py css js

This will automatically fetch the remaining dependencies (bower, less) and
install them in a subdirectory.

For quick iteration on the Notebook's JavaScript you can deactivate the use of
the bundled and minified JavaScript by using the option
``--NotebookApp.ignore_minified_js=True``.  This might though highly increase the
number of requests that the browser make to the server, but can allow to test
JavaScript file modification without going through the compilation step that
can take up to 30 sec.
