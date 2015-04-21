.. _development:

Development
===========


CSS live reloading
------------------

If you are working on notebook styling, you can use the live-reloading option
of gulp to watch for changes in the `.less` files and automatically rebuild the
`css` and reload the current page. 

To do so we rely on the livereaload extension of various browser (`for chrome
<https://chrome.google.com/webstore/detail/livereload/jnihajbhpnppcggbcgedagnkighmdlei>`_),
and the gulp-livereload extension. 


To use the livereload extension, in the root of `jupyter_notebook` project launch::

    $ gulp watch
    
    
Any changes to any of the less files under the `jupyter_notebook/static`
directory will trigger a rebuild of css and ask the reload extension to reload
the current page. 

Do not forget to activate the extension for the current page by clicking on it. 
The dot at the center of the extension icon will be come darker when the extension is activated. 



