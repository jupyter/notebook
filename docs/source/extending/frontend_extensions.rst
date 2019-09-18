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

.. _AMD module: https://en.wikipedia.org/wiki/Asynchronous_module_definition

A front-end extension is a JavaScript file that defines an `AMD module`_
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

In this example, we changed a keyboard shortcut in **command mode**; you
can also customize keyboard shortcuts in **edit mode**.
However, most of the keyboard shortcuts in edit mode are handled by CodeMirror,
which supports custom key bindings via a completely different API.


Defining and registering your own actions
-----------------------------------------

As part of your front-end extension, you may wish to define actions, which can
be attached to toolbar buttons, or called from the command palette. Here is an
example of an extension that defines an (not very useful!) action to show an
alert, and adds a toolbar button using the full action name:

.. code:: javascript

    // file my_extension/main.js

    define([
        'base/js/namespace'
    ], function(
        Jupyter
    ) {
        function load_ipython_extension() {

            var handler = function () {
                alert('this is an alert from my_extension!');
            };

            var action = {
                icon: 'fa-comment-o', // a font-awesome class used on buttons, etc
                help    : 'Show an alert',
                help_index : 'zz',
                handler : handler
            };
            var prefix = 'my_extension';
            var action_name = 'show-alert';

            var full_action_name = Jupyter.actions.register(action, action_name, prefix); // returns 'my_extension:show-alert'
            Jupyter.toolbar.add_buttons_group([full_action_name]);
        }

        return {
            load_ipython_extension: load_ipython_extension
        };
    });

Every action needs a name, which, when joined with its prefix to make the full
action name, should be unique. Built-in actions, like the
``jupyter-notebook:restart-kernel`` we bound in the earlier
`Modifying key bindings`_ example, use the prefix ``jupyter-notebook``. For
actions defined in an extension, it makes sense to use the extension name as
the prefix. For the action name, the following guidelines should be considered:

.. adapted from notebook/static/notebook/js/actions.js

* First pick a noun and a verb for the action. For example, if the action is
  "restart kernel," the verb is "restart" and the noun is "kernel".
* Omit terms like "selected" and "active" by default, so "delete-cell", rather
  than "delete-selected-cell". Only provide a scope like "-all-" if it is other
  than the default "selected" or "active" scope.
* If an action has a secondary action, separate the secondary action with
  "-and-", so "restart-kernel-and-clear-output".
* Use above/below or previous/next to indicate spatial and sequential
  relationships.
* Don't ever use before/after as they have a temporal connotation that is
  confusing when used in a spatial context.
* For dialogs, use a verb that indicates what the dialog will accomplish, such
  as "confirm-restart-kernel".


Installing and enabling extensions
----------------------------------

You can install your nbextension with the command::

    jupyter nbextension install path/to/my_extension/ [--user|--sys-prefix]

The default installation is system-wide. You can use ``--user`` to do a
per-user installation, or ``--sys-prefix`` to install to Python's prefix (e.g.
in a virtual or conda environment). Where my_extension is the directory
containing the Javascript files. This will copy it to a Jupyter data directory
(the exact location is platform dependent - see :ref:`jupyter_path`).

For development, you can use the ``--symlink`` flag to symlink your extension
rather than copying it, so there's no need to reinstall after changes.

To use your extension, you'll also need to **enable** it, which tells the
notebook interface to load it. You can do that with another command::

    jupyter nbextension enable my_extension/main [--sys-prefix][--section='common']

The argument refers to the Javascript module containing your
``load_ipython_extension`` function, which is ``my_extension/main.js`` in this
example. The ``--section='common'`` argument will affect all pages, by default 
it will be loaded on the notebook view only. 
There is a corresponding ``disable`` command to stop using an
extension without uninstalling it.

.. versionchanged:: 4.2

    Added ``--sys-prefix`` argument


Kernel Specific extensions
--------------------------

.. warning::

  This feature serves as a stopgap for kernel developers who need specific
  JavaScript injected onto the page. The availability and API are subject to
  change at anytime.


It is possible to load some JavaScript on the page on a per kernel basis. Be
aware that doing so will make the browser page reload without warning as
soon as the user switches the kernel without notice.

If you, a kernel developer, need a particular piece of JavaScript to be loaded
on a "per kernel" basis, such as:

* if you are developing a CodeMirror mode for your language
* if you need to enable some specific debugging options

your ``kernelspecs`` are allowed to contain a ``kernel.js`` file that defines
an AMD module. The AMD module should define an `onload` function that will be
called when the kernelspec loads, such as:

* when you load a notebook that uses your kernelspec
* change the active kernelspec of a notebook to your kernelspec.

Note that adding a `kernel.js` to your kernelspec will add an unexpected side
effect to changing a kernel in the notebook. As it is impossible to "unload"
JavaScript, any attempt to change the kernelspec again will save the current
notebook and reload the page without confirmations.

Here is an example of ``kernel.js``:

.. code:: javascript

    define(function(){
      return {onload: function(){
        console.info('Kernel specific javascript loaded');

        // do more things here, like define a codemirror mode

      }}

    });
