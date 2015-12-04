
`View the original notebook on nbviewer <http://nbviewer.jupyter.org/github/jupyter/notebook/blob/master/docs/source/examples/Notebook/Custom%20Keyboard%20Shortcuts.ipynb>`__

Keyboard Shortcut Customization
===============================

Starting with IPython 2.0 keyboard shortcuts in command and edit mode
are fully customizable. These customizations are made using the Jupyter
JavaScript API. Here is an example that makes the ``r`` key available
for running a cell:

.. code:: python

    %%javascript
    
    Jupyter.keyboard_manager.command_shortcuts.add_shortcut('r', {
        help : 'run cell',
        help_index : 'zz',
        handler : function (event) {
            IPython.notebook.execute_cell();
            return false;
        }}
    );

"By default the keypress ``r``, while in command mode, changes the type
of the selected cell to ``raw``. This shortcut is overridden by the code
in the previous cell, and thus the action no longer be available via the
keypress ``r``."

There are a couple of points to mention about this API:

-  The ``help_index`` field is used to sort the shortcuts in the
   Keyboard Shortcuts help dialog. It defaults to ``zz``.
-  When a handler returns ``false`` it indicates that the event should
   stop propagating and the default action should not be performed. For
   further details about the ``event`` object or event handling, see the
   jQuery docs.
-  If you don't need a ``help`` or ``help_index`` field, you can simply
   pass a function as the second argument to ``add_shortcut``.

.. code:: python

    %%javascript
    
    Jupyter.keyboard_manager.command_shortcuts.add_shortcut('r', function (event) {
        IPython.notebook.execute_cell();
        return false;
    });

Likewise, to remove a shortcut, use ``remove_shortcut``:

.. code:: python

    %%javascript
    
    Jupyter.keyboard_manager.command_shortcuts.remove_shortcut('r');

If you want your keyboard shortcuts to be active for all of your
notebooks, put the above API calls into your ``custom.js`` file.

Of course we provide name for majority of existing action so that you do
not have to re-write everything, here is for example how to bind ``r``
back to it's initial behavior:

.. code:: python

    %%javascript
    
    Jupyter.keyboard_manager.command_shortcuts.add_shortcut('r', 'jupyter-notebook:change-cell-to-raw');

`View the original notebook on nbviewer <http://nbviewer.jupyter.org/github/jupyter/notebook/blob/master/docs/source/examples/Notebook/Custom%20Keyboard%20Shortcuts.ipynb>`__
