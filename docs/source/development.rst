.. _development:

Development
===========

Installing Javascript machinery
-------------------------------

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

CSS live reloading
------------------

If you are working on notebook styling, you can use the live-reloading option
of gulp to watch for changes in the `.less` files and automatically rebuild the
`css` and reload the current page. 

To do so we rely on the livereaload extension of various browser (`for chrome
<https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei>`_),
and the gulp-livereload extension. 


To use the livereload extension, in the root of `notebook` project launch::

    $ gulp watch
    
    
Any changes to any of the less files under the `notebook/static`
directory will trigger a rebuild of css and ask the reload extension to reload
the current page. 

Do not forget to activate the extension for the current page by clicking on it. 
The dot at the center of the extension icon will be come darker when the extension is activated. 



