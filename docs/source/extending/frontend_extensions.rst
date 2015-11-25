Custom front-end extesions
==========================

This describe the basic steps to write a JavaScript extension for the Jupyter
notebook front-end. This allows you to customize the behavior of the various
pages like the dashboard, the notebook, the text editor. 

The structure of an extension
-----------------------------

.. note::

    The notebook fontend and Javascript API are not stable, and are subject to
    lot of changes. Any extension written for the current notebook is almost
    guarantied to break in the next release.

A front-end extension is a JavaScript file that define an AMD module which
expose at least a function called `load_ipython_extension` which takes no
arguments. We will not get into details about what each of these term are, 
but here is the minimal code needed for a working extension:

.. code:: javascript

    //file myext/main.js

    define(function(){

        function load_ipython_extension(){
            console.info('this is my first extension')
        }

        return {load_ipython_extension: load_ipython_extension };
    })

.. note::
    
    for historical reason the function is called `load_ipython_extension`,
    though it does apply to the Jupyter notebook as well and will work
    regardless of the kernel you use. 

If you are familiar with JavaScript, you can use this template to require any
Jupyter module and modify their configuration.  Your extension will be loaded
at the right time during the notebook page initialisation for you to hook
listener for the various even that the page can trigger. 

You might want to access to the current instances of the various component on
the page, these a re exposed by a module name `base/js/namespace`.  If you plan
on accessing instances on the page, be careful to require this module and not
access the global variable `Jupyter`.

Here is how to do that:


.. code:: javascript

    //file myext/main.js

    define(['base/js/namespace'],function(Jupyter){

        function load_ipython_extension(){
            console.log('This is the current notebook application instance', Jupyter.notebook);
        }

        return {load_ipython_extension: load_ipython_extension };
    })



Modify key bindings
-------------------

One of the ability of extensions is to modify key bindings, once again this is
a API which is not guarantied to be stable. Though the request for custom key
bindings is often require and helpful to increase accessibility, so in the
following we show how to access theses.

Here is an example of extension that will unbind `0,0` in command mode to
restart the kernel, and bind `0,0,0` in it's place.

.. code:: javascript

    //file myext/main.js

    define(['base/js/namespace'],function(Jupyter){

        function load_ipython_extension(){
            Jupyter.keyboard_manager.command_shortcuts.remove_shortcut('0,0')
            Jupyter.keyboard_manager.command_shortcuts.add_shortcut('0,0,0', 'jupyter-notebook:restart-kernel')
        }

        return {load_ipython_extension: load_ipython_extension };
    })

.. note::
    
    We are awre the keybindings might not work correctly on non US keyboard,
    unfortunately it is a limitation of browser implmentation and teh status of
    the keyboard handling on the web. We appreciate you input if you have issue
    binding some keys, or help to improve the situation. 

You can see that I have used the **command name**
`jupyter-notebook:restart-kernel` to bind the new shortcut. There is no API yet
to access the list of all available *commands*, though the following in the
JavaScript console of your browser on a notebook page should give you an idea
of what of available. 



.. code:: javascript

    Object.keys(IPython.actions._actions)

I'm also binding keyboard shortcut on the **command mode** you can also bind
them on the edit mode. Keep in mind though the most keyboard shortcuts on the
edit mode are handled by CodeMirror which also support custom key bindings, but
not using the system describe here. 

You can also define and register your own action to be used, but the
documentation for it has not been written yet. If you need to do it, 
please ask us, we can give you the necessary information, and we would appreciate
if you could format them in a detailed way in place of this paragraph.



installation and activation of extension
----------------------------------------

You can install your extension in the Jupyter configuration directory, under
the `nbextensions` subdirectory. On Unix system this will likely be
`~/.jupyter/nbextensions/`. 

You thus will likely end up with the file
`~/.jupyter/nbextensions/myextension/main.js` that now need to be loaded by the
notebook. You can configure you Jupyter Notebook to do so using the Jupyter
front-end configuration system described later in these docs. 

A 1 line to activate you extension would be to issue the following **once** in
a notebook JavaScript console:

.. code:: javascript

    Jupyter.notebook.config.update({
      "load_extensions": {"myextension/main": true}
    }) 

