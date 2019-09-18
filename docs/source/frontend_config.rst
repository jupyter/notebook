.. _frontend_config:

Configuring the notebook frontend
=================================

.. note::

    The ability to configure the notebook frontend UI and preferences is
    still a work in progress.

This document is a rough explanation on how you can persist some configuration
options for the notebook JavaScript.

There is no exhaustive list of all the configuration options as most options
are passed down to other libraries, which means that non valid
configuration can be ignored without any error messages.


How front end configuration works
---------------------------------
The frontend configuration system works as follows:

  - get a handle of a configurable JavaScript object.
  - access its configuration attribute.
  - update its configuration attribute with a JSON patch.


Example - Changing the notebook's default indentation
-----------------------------------------------------
This example explains how to change the default setting ``indentUnit``
for CodeMirror Code Cells::

    var cell = Jupyter.notebook.get_selected_cell();
    var config = cell.config;
    var patch = {
          CodeCell:{
            cm_config:{indentUnit:2}
          }
        }
    config.update(patch)

You can enter the previous snippet in your browser's JavaScript console once.
Then reload the notebook page in your browser. Now, the preferred indent unit
should be equal to two spaces. The custom setting persists and you do not need
to reissue the patch on new notebooks.

``indentUnit``, used in this example, is one of the many `CodeMirror options
<https://codemirror.net/doc/manual.html#option_indentUnit>`_ which are available
for configuration.


Example - Restoring the notebook's default indentation
------------------------------------------------------
If you want to restore a notebook frontend preference to its default value,
you will enter a JSON patch with a ``null`` value for the preference setting.

For example, let's restore the indent setting ``indentUnit`` to its default of
four spaces. Enter the following code snippet in your JavaScript console::

    var cell = Jupyter.notebook.get_selected_cell();
    var config = cell.config;
    var patch = {
          CodeCell:{
            cm_config:{indentUnit: null} // only change here.
          }
        }
    config.update(patch)

Reload the notebook in your browser and the default indent should again be two
spaces.

Persisting configuration settings
---------------------------------
Under the hood, Jupyter will persist the preferred configuration settings in
``~/.jupyter/nbconfig/<section>.json``, with ``<section>``
taking various value depending on the page where the configuration is issued.
``<section>`` can take various values like ``notebook``, ``tree``, and
``editor``. A ``common`` section contains configuration settings shared by all
pages.
