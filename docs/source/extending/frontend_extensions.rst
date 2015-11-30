Custom front-end extesions
==========================

This describes the basic steps to write a JavaScript extension for the Jupyter
notebook front-end. This allows you to customize the behaviour of the various
pages like the dashboard, the notebook, or the text editor.

The structure of an extension
-----------------------------

.. note::

    The notebook frontend and Javascript API are not stable, and are subject to
    a lot of changes. Any extension written for the current notebook is almost
    guaranteed to break in the next release.

A front-end extension is a JavaScript file that defines an AMD module
exposing at least a function called `load_ipython_extension`, which takes no
arguments. We will not get into the details of what each of these terms are,
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
    
    For historical reasons, the function is called `load_ipython_extension`,
    but it does apply to the Jupyter notebook as well, and will work
    regardless of the kernel you use. 

If you are familiar with JavaScript, you can use this template to require any
Jupyter module and modify its configuration. Your extension will be loaded
at the right time during the notebook page initialisation for you to set up a
listener for the various events that the page can trigger.

You might want to access to the current instances of the various component on
the page, these are exposed by a module named `base/js/namespace`. If you plan
on accessing instances on the page, you should require this module rather than
accessing the global variable `Jupyter`. Here is how to do that:

.. code:: javascript

    //file myext/main.js

    define(['base/js/namespace'],function(Jupyter){

        function load_ipython_extension(){
            console.log('This is the current notebook application instance', Jupyter.notebook);
        }

        return {load_ipython_extension: load_ipython_extension };
    })



Modifying key bindings
----------------------

Extensions have the ability to modify key bindings. Once again, this API
is not guaranteed to be stable, but changing key bindings is a common request.
This is how to do it in the current version of the notebook.

Here is an example of extension that will unbind `0,0` in command mode, which
normally restarts the kernel, and bind `0,0,0` in it's place.

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
    
    Keybindings might not work correctly on non-US keyboards.
    Unfortunately, this is a limitation of browser implementations and the status of
    keyboard event handling on the web. We appreciate your feedback if you have
    issues binding keys, or ideas to help improve the situation.

You can see that I have used the **command name**
`jupyter-notebook:restart-kernel` to bind the new shortcut. There is no API yet
to access the list of all available *commands*, though the following in the
JavaScript console of your browser on a notebook page should give you an idea
of what of available:

.. code:: javascript

    Object.keys(IPython.actions._actions)

In this example, we changed keyboard shortcuts in **command mode**; you can also
customise keyboard shortcuts in edit mode.
However, most of the keyboard shortcuts in edit mode are handled by CodeMirror,
which supports custom key bindings via a completely different API.

You can also define and register your own action to be used, but the
documentation for this has not been written yet. If you need to do it,
please ask us, we can give you the necessary information, and we would appreciate
if you could format them in a detailed way in place of this paragraph.

Installing and enabling extensions
----------------------------------

You can install your nbextension with the command:

    jupyter nbextension install path/to/myext/

Where myext is the directory containing the Javascript files. This will copy
it to a Jupyter data directory (the exact location is platform dependent - see
:ref:`jupyter_path`).

For development, you can use the ``--symlink`` flag to symlink your extension
rather than copying it, so there's no need to reinstall after changes.

To use your extension, you'll also need to **enable** it, which tells the
notebook interface to load it. You can do that with another command:

    jupyter nbextension enable myext/main

The argument refers to the Javascript module containing your ``load_ipython_extension``
function, which is ``myext/main.js`` in this example. There is a corresponding
``disable`` command to stop using an extension without installing it.
