Customize keymaps
=================

.. note::

    Declarative Custom Keymaps is a provisional feature with unstable API
    which is not guaranteed to be kept in future versions of the notebook,
    and can be removed or changed without warnings.

The notebook shortcuts that are defined by jupyter both in edit mode an command
mode are configurable in the frontend configuration file
``~/.jupyter/nbconfig/notebook.json``. The modification of Keyboard shortcut
suffer of several limitations, mainly that your Browser and OS might prevent
certain shortcut to work correctly. If this is the case, there are
unfortunately not much than can be done. The second issue can arise with
keyboard that have a layout different than US English. Again even if we are
aware of the issue, there is not much we can do about that.

Shortcut are also limited by the underlying library that handle code and text
edition: CodeMirror. If some Keyboard shortcuts are conflicting, the method
describe below might not work to create new keyboard shortcuts, especially in
the ``edit`` mode of the notebook.


The 4 sections of interest in ``~/.jupyter/nbconfig/notebook.json`` are the
following:

  - ``keys.command.unbind``
  - ``keys.edit.unbind``
  - ``keys.command.bind``
  - ``keys.edit.bind``

The first two section describe which default keyboard shortcut not to register
at notebook startup time. These are mostly useful if you need to ``unbind`` a
default keyboard shortcut before binding it to a new ``command``.

These two first sections apply respectively to the ``command`` and ``edit``
mode of the notebook. They take a list of shortcut to ``unbind``.

For example, to unbind the shortcut to split a cell at the position of the
cursor (``Ctrl-Shift-Minus``)use the  following:

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




The last two section describe which new keyboard shortcut to register
at notebook startup time, and which actions they trigger.

These two last sections apply respectively to the ``command`` and ``edit``
mode of the notebook. They take a dictionary with shortcuts as ``keys`` and
``commands`` name as value.

For example, to bind the shortcut ``G,G,G`` (Press G three time in a row) in
command mode, to the command that restart the kernel and run all cells, use the
following:


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




The name of the available ``commands`` can be find by hovering the right end of
a row in the command palette.
