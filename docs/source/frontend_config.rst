.. _frontend_config:

Configuring the notebook frontend
=================================

The ability to configure the UI and the preferences on the notebook frontend is
still work in progress. This document is a rough explanation on how you can
persist some configuration options for the notebook JavaScript.

There is no exhaustive list on all the configuration option are most options
are just passed down to other libraries, which mean that non valid
configuration can be ignored without any error messages.


The frontend configuration system works as follow :

  - get a handle of a configurable JavaScript object.
  - access it's configuration attribute.
  - update it's configuration attribute with a JSON patch.

Here is a example on how it's look like for changing the default ``indentUnit``
for CodeMirror Code Cells:

.. sourcecode::

    var cell = Jupyter.notebook.get_selected_cell();
    var config = cell.config;
    var patch = {
          CodeCell:{
            cm_config:{indentUnit:2}
          }
        } 
    config.update(patch)



You can enter the previous snippet in your browser console once, reload the
notebook page.  Now the default indent unit of all code cell should be equal to
2 space.  You do not need to reissue the command on new notebooks.



``indentUnit`` is here a `Codemirror option
<https://codemirror.net/doc/manual.html#option_indentUnit>`_ taken as an
example, but many other configuration options are available.

If you need to restore the default value just provide a JSON patch with
``null`` value. For example to restore the indent value to it's default (of 4)
write the following on your JavaScript console:

.. sourcecode::

    var cell = Jupyter.notebook.get_selected_cell();
    var config = cell.config;
    var patch = {
          CodeCell:{
            cm_config:{indentUnit: null} # only change here.
          }
        }
    config.update(patch)


Under the hood, it will persist the configuration file in
``~/.jupyter/nbconfig/<section>.json``, with section taking various value
depending on the page where the configuration is issued.  ``section`` can take
various value like ``notebook``, ``tree``, ``editor``. A ``common`` section is
shared by all pages.
