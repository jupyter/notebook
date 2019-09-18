Customize keymaps
=================

.. note::

    Declarative Custom Keymaps is a provisional feature with unstable API
    which is not guaranteed to be kept in future versions of the notebook,
    and can be removed or changed without warnings.

The notebook shortcuts that are defined by jupyter both in edit mode and 
command mode are configurable in the frontend configuration file
``~/.jupyter/nbconfig/notebook.json``. The modification of keyboard 
shortcuts suffers from several limitations, mainly that your Browser and OS 
might prevent certain shortcuts from working correctly. If this is the case,
there is unfortunately not much that can be done. The second issue can arise
with keyboards that have a layout different than US English. Again, even if 
we are aware of the issue, there is not much that can be done.

Shortcuts are also limited by the underlying library that handles code and 
text editing: CodeMirror. If some keyboard shortcuts are conflicting, the 
method described below might not work to create new keyboard shortcuts, 
especially in the ``edit`` mode of the notebook.


The 4 sections of interest in ``~/.jupyter/nbconfig/notebook.json`` are the
following:

  - ``keys.command.unbind``
  - ``keys.edit.unbind``
  - ``keys.command.bind``
  - ``keys.edit.bind``

The first two sections describe which default keyboard shortcuts not to 
register at notebook startup time. These are mostly useful if you need to 
``unbind`` a default keyboard shortcut before binding it to a new 
``command``.

The first two sections apply respectively to the ``command`` and ``edit``
mode of the notebook. They take a list of shortcuts to ``unbind``.

For example, to unbind the shortcut to split a cell at the position of the
cursor (``Ctrl-Shift-Minus``) use the following:

.. code:: javascript

    // file ~/.jupyter/nbconfig/notebook.json

    {
      "keys": {
        "edit": {
          "unbind": [
            "Ctrl-Shift-Minus"
          ]
        },
      },
    }




The last two sections describe which new keyboard shortcuts to register
at notebook startup time and which actions they trigger.

The last two sections apply respectively to the ``command`` and ``edit``
mode of the notebook. They take a dictionary with shortcuts as ``keys`` and
``commands`` name as value.

For example, to bind the shortcut ``G,G,G`` (Press G three time in a row) in
command mode to the command that restarts the kernel and runs all cells, use
the following:


.. code:: javascript

    // file ~/.jupyter/nbconfig/notebook.json

    {
      "keys": {
        "command": {
            "bind": {
                "G,G,G":"jupyter-notebook:restart-kernel-and-run-all-cells"
            }
        }
      },
    }




The name of the available ``commands`` can be find by hovering over the 
right end of a row in the command palette.
