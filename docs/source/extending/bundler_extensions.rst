Custom bundler extensions
=========================

The notebook server supports the writing of *bundler extensions* that
transform, package, and download/deploy notebook files. As a developer, you
need only write a single Python function to implement a bundler. The notebook
server automatically generates a *File -> Download as* or *File -> Deploy as*
menu item in the notebook front-end to trigger your bundler.

Here are some examples of what you can implement using bundler extensions:

* Convert a notebook file to a HTML document and publish it as a post on a
  blog site
* Create a snapshot of the current notebook environment and bundle that
  definition plus notebook into a zip download
* Deploy a notebook as a standalone, interactive `dashboard <https://github.com/jupyter-incubator/dashboards_bundlers>`_

To implement a bundler extension, you must do all of the following:

* Declare bundler extension metadata in your Python package
* Write a `bundle` function that responds to bundle requests
* Instruct your users on how to enable/disable your bundler extension

The following sections describe these steps in detail.

Declaring bundler metadata
--------------------------

You must provide information about the bundler extension(s) your package
provides by implementing a `_jupyter_bundlerextensions_paths` function. This
function can reside anywhere in your package so long as it can be imported
when enabling the bundler extension. (See :ref:`enabling-bundlers`.)

.. code:: python

    # in mypackage.hello_bundler

    def _jupyter_bundlerextension_paths():
        """Example "hello world" bundler extension"""
        return [{
            'name': 'hello_bundler',                    # unique bundler name
            'label': 'Hello Bundler',                   # human-redable menu item label
            'module_name': 'mypackage.hello_bundler',   # module containing bundle()
            'group': 'deploy'                           # group under 'deploy' or 'download' menu
        }]

Note that the return value is a list. By returning multiple dictionaries in
the list, you allow users to enable/disable sets of bundlers all at once.

Writing the `bundle` function
-----------------------------

At runtime, a menu item with the given label appears either in the
*File ->  Deploy as* or *File -> Download as* menu depending on the `group`
value in your metadata. When a user clicks the menu item, a new browser tab
opens and notebook server invokes a `bundle` function in the `module_name`
specified in the metadata.

You must implement a `bundle` function that matches the signature of the
following example:

.. code:: python

    # in mypackage.hello_bundler

    def bundle(handler, model):
        """Transform, convert, bundle, etc. the notebook referenced by the given
        model.

        Then issue a Tornado web response using the `handler` to redirect
        the user's browser, download a file, show a HTML page, etc. This function
        must finish the handler response before returning either explicitly or by
        raising an exception.

        Parameters
        ----------
        handler : tornado.web.RequestHandler
            Handler that serviced the bundle request
        model : dict
            Notebook model from the configured ContentManager
        """
        handler.finish('I bundled {}!'.format(model['path']))

Your `bundle` function is free to do whatever it wants with the request and
respond in any manner. For example, it may read additional query parameters
from the request, issue a redirect to another site, run a local process (e.g.,
`nbconvert`), make a HTTP request to another service, etc.

The caller of the `bundle` function is `@tornado.gen.coroutine` decorated and
wraps its call with `torando.gen.maybe_future`. This behavior means you may
handle the web request synchronously, as in the example above, or
asynchronously using `@tornado.gen.coroutine` and `yield`, as in the example
below.

.. code:: python

    from tornado import gen

    @gen.coroutine
    def bundle(handler, model):
      # simulate a long running IO op (e.g., deploying to a remote host)
      yield gen.sleep(10)

      # now respond
      handler.finish('I spent 10 seconds bundling {}!'.format(model['path']))

You should prefer the second, asynchronous approach when your bundle operation
is long-running and would otherwise block the notebook server main loop if
handled synchronously.

For more details about the data flow from menu item click to bundle function
invocation, see :ref:`bundler-details`.

.. _enabling-bundlers:

Enabling/disabling bundler extensions
-------------------------------------

The notebook server includes a command line interface (CLI) for enabling and
disabling bundler extensions.

You should document the basic commands for enabling and disabling your
bundler. One possible command for enabling the `hello_bundler` example is the
following:

.. code:: bash

    jupyter bundlerextension enable --py mypackage.hello_bundler --sys-prefix

The above updates the notebook configuration file in the current
conda/virtualenv environment (`--sys-prefix`) with the metadata returned by
the `mypackage.hellow_bundler._jupyter_bundlerextension_paths` function.

The corresponding command to later disable the bundler extension is the
following:

.. code:: bash

    jupyter bundlerextension disable --py mypackage.hello_bundler --sys-prefix

For more help using the `bundlerextension` subcommand, run the following.

.. code:: bash

    jupyter bundlerextension --help

The output describes options for listing enabled bundlers, configuring
bundlers for single users, configuring bundlers system-wide, etc.

Example: IPython Notebook bundle (.zip)
---------------------------------------

The `hello_bundler` example in this documentation is simplisitic in the name
of brevity. For more meaningful examples, see
`notebook/bundler/zip_bundler.py` and `notebook/bundler/tarball_bundler.py`.
You can enable them to try them like so:

.. code:: bash

    jupyter bundlerextension enable --py notebook.bundler.zip_bundler --sys-prefix
    jupyter bundlerextension enable --py notebook.bundler.tarball_bundler --sys-prefix

.. _bundler-details:

Bundler invocation details
--------------------------

Support for bundler extensions comes from Python modules in `notebook/bundler`
and JavaScript in `notebook/static/notebook/js/menubar.js`. The flow of data
between the various components proceeds roughly as follows:

1. User opens a notebook document
2. Notebook front-end JavaScript loads notebook configuration
3. Bundler front-end JS creates menu items for all bundler extensions in the
   config
4. User clicks a bundler menu item
5. JS click handler opens a new browser window/tab to
   `<notebook base_url>/bundle/<path/to/notebook>?bundler=<name>` (i.e., a
   HTTP GET request)
6. Bundle handler validates the notebook path and bundler `name`
7. Bundle handler delegates the request to the `bundle` function in the
   bundler's `module_name`
8. `bundle` function finishes the HTTP request
