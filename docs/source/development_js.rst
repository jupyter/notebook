.. _development_js:

Installing JavaScript machinery
===============================

.. note::

    This section is prepared for contributors to the Notebook source code.
    Users of the released Notebook do not need to install the JavaScript
    tools.

Building the Notebook from its GitHub source code requires some tools to
create and minify JavaScript components and the CSS. These tools and the
following steps are used when making a Notebook release.

#. Install `Node.js <https://nodejs.org/>`_ and `npm`.

   - Using the installers on Node.js website:

     Select a pre-built installer
     on the Node.js website. The installer will include `Node.js` and
     Node's package manager, `npm`.

   - Using system's package manager:

     Install `node.js` and `npm` using the
     system's package manager. For example, the command for Ubuntu or Debian
     is:

     .. code:: bash

         sudo apt-get install nodejs-legacy npm

#. Build the JavaScript and CSS by running:

   .. code:: bash

       python setup.py css js

   This command will automatically fetch the remaining dependencies (bower,
   less) and install them in a subdirectory.

Prototyping tip
---------------
When doing prototyping which needs quick iteration of the Notebook's
JavaScript, the bundled and minified JavaScript may be deactivated. To do
this, start the Notebook with the option
``--NotebookApp.ignore_minified_js=True``.  This may highly increase
the number of requests that the browser makes to the server; yet, allows
testing JavaScript file modification without going through the time consuming
compilation step that may take up to 30 seconds.
