Custom front-end extensions
===========================

This describes the basic steps to write a JavaScript extension for the Jupyter
notebook front-end. This allows you to customize the behaviour of the various
pages like the dashboard, the notebook, or the text editor.

The structure of a front-end extension
--------------------------------------

.. note::

    The notebook front-end and Javascript API are not stable, and are subject
    to a lot of changes. Any extension written for the current notebook is
    almost guaranteed to break in the next release.

A front-end extension is a JavaScript file that defines an
[AMD module](https://en.wikipedia.org/wiki/Asynchronous_module_definition)
which exposes at least a function called ``load_ipython_extension``, which
takes no arguments. We will not get into the details of what each of these
terms consists of yet, but here is the minimal code needed for a working
extension:

.. code:: javascript

    // file my_extension/main.js

    define(function(){

        function load_ipython_extension(){
            console.info('this is my first extension');
        }

        return {
            load_ipython_extension: load_ipython_extension
        };
    });

.. note::
    
    Although for historical reasons the function is called
    ``load_ipython_extension``, it does apply to the Jupyter notebook in
    general, and will work regardless of the kernel in use.

If you are familiar with JavaScript, you can use this template to require any
Jupyter module and modify its configuration, or do anything else in client-side
Javascript. Your extension will be loaded at the right time during the notebook
page initialisation for you to set up a listener for the various events that
the page can trigger.

You might want access to the current instances of the various Jupyter notebook
components on the page, as opposed to the classes defined in the modules. The
current instances are exposed by a module named ``base/js/namespace``. If you
plan on accessing instances on the page, you should ``require`` this module
rather than accessing the global variable ``Jupyter``, which will be removed in
future. The following example demonstrates how to access the current notebook
instance:

.. code:: javascript

    // file my_extension/main.js

    define([
        'base/js/namespace'
    ], function(
        Jupyter
    ) {
        function load_ipython_extension() {
            console.log(
                'This is the current notebook application instance:',
                Jupyter.notebook
            );
        }

        return {
            load_ipython_extension: load_ipython_extension
        };
    });


Modifying key bindings
----------------------

One of the abilities of extensions is to modify key bindings, although once
again this is an API which is not guaranteed to be stable. However, custom key
bindings are frequently requested, and are helpful to increase accessibility,
so in the following we show how to access them.

Here is an example of an extension that will unbind the shortcut ``0,0`` in
command mode, which normally restarts the kernel, and bind ``0,0,0`` in its
place:

.. code:: javascript

    // file my_extension/main.js

    define([
        'base/js/namespace'
    ], function(
        Jupyter
    ) {

        function load_ipython_extension() {
            Jupyter.keyboard_manager.command_shortcuts.remove_shortcut('0,0');
            Jupyter.keyboard_manager.command_shortcuts.add_shortcut('0,0,0', 'jupyter-notebook:restart-kernel');
        }

        return {
            load_ipython_extension: load_ipython_extension
        };
    });

.. note::
    
    The standard keybindings might not work correctly on non-US keyboards.
    Unfortunately, this is a limitation of browser implementations and the
    status of keyboard event handling on the web in general. We appreciate your
    feedback if you have issues binding keys, or have any ideas to help improve
    the situation.

You can see that I have used the **action name**
``jupyter-notebook:restart-kernel`` to bind the new shortcut. There is no API
yet to access the list of all available *actions*, though the following in the
JavaScript console of your browser on a notebook page should give you an idea
of what is available:

.. code:: javascript

    Object.keys(require('base/js/namespace').actions._actions);

In this example, we changed the keyboard shortcut in the **command mode**; you
can also customize keyboard shortcuts in **edit mode**.
However, most of the keyboard shortcuts in edit mode are handled by CodeMirror,
which supports custom key bindings via a completely different API.

You can also define and register your own **actions** to be used, but the
documentation for this has not been written yet. If you need to do it, please
ask us, we can give you the necessary information, and we would appreciate if
you could format them in a detailed way in place of this paragraph.

Installing and enabling extensions
----------------------------------

You can install your nbextension with the command:

    jupyter nbextension install path/to/my_extension/

Where my_extension is the directory containing the Javascript files.
This will copy it to a Jupyter data directory (the exact location is platform
dependent - see :ref:`jupyter_path`).

For development, you can use the ``--symlink`` flag to symlink your extension
rather than copying it, so there's no need to reinstall after changes.

To use your extension, you'll also need to **enable** it, which tells the
notebook interface to load it. You can do that with another command:

    jupyter nbextension enable my_extension/main

The argument refers to the Javascript module containing your
``load_ipython_extension`` function, which is ``my_extension/main.js`` in this
example. There is a corresponding ``disable`` command to stop using an
extension without uninstalling it.
