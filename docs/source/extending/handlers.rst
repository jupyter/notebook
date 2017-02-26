Custom request handlers
=======================

The notebook webserver can be interacted with using a well `defined
RESTful
API <http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml>`__.
You can define custom RESTful API handlers in addition to the ones
provided by the notebook. As described below, to define a custom handler
you need to first write a notebook server extension. Then, in the
extension, you can register the custom handler.

Writing a notebook server extension
-----------------------------------

The notebook webserver is written in Python, hence your server extension
should be written in Python too. Server extensions, like IPython
extensions, are Python modules that define a specially named load
function, ``load_jupyter_server_extension``. This function is called
when the extension is loaded.

.. code:: python

    def load_jupyter_server_extension(nb_server_app):
        """
        Called when the extension is loaded.

        Args:
            nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
        """
        pass

To get the notebook server to load your custom extension, you'll need to
add it to the list of extensions to be loaded. You can do this using the
config system. ``NotebookApp.nbserver_extensions`` is a config variable
which is a dictionary of strings, each a Python module to be imported, mapping
to ``True`` to enable or ``False`` to disable each extension.
Because this variable is notebook config, you can set it two different
ways, using config files or via the command line.

For example, to get your extension to load via the command line add a
double dash before the variable name, and put the Python dictionary in
double quotes. If your package is "mypackage" and module is
"mymodule", this would look like
``jupyter notebook --NotebookApp.nbserver_extensions="{'mypackage.mymodule':True}"``
.
Basically the string should be Python importable.

Alternatively, you can have your extension loaded regardless of the
command line args by setting the variable in the Jupyter config file.
The default location of the Jupyter config file is
``~/.jupyter/jupyter_notebook_config.py`` (see :doc:`/config_overview`). Inside
the config file, you can use Python to set the variable. For example,
the following config does the same as the previous command line example.

.. code:: python

    c = get_config()
    c.NotebookApp.nbserver_extensions = {
        'mypackage.mymodule': True,
    }

Before continuing, it's a good idea to verify that your extension is
being loaded. Use a print statement to print something unique. Launch
the notebook server and you should see your statement printed to the
console.

Registering custom handlers
---------------------------

Once you've defined a server extension, you can register custom handlers
because you have a handle to the Notebook server app instance
(``nb_server_app`` above). However, you first need to define your custom
handler. To declare a custom handler, inherit from
``notebook.base.handlers.IPythonHandler``. The example below[1] is a
Hello World handler:

.. code:: python

    from notebook.base.handlers import IPythonHandler

    class HelloWorldHandler(IPythonHandler):
        def get(self):
            self.finish('Hello, world!')

The Jupyter Notebook server use
`Tornado <http://www.tornadoweb.org/en/stable/>`__ as its web framework.
For more information on how to implement request handlers, refer to the
`Tornado documentation on the
matter <http://www.tornadoweb.org/en/stable/web.html#request-handlers>`__.

After defining the handler, you need to register the handler with the
Notebook server. See the following example:

.. code:: python

    web_app = nb_server_app.web_app
    host_pattern = '.*$'
    route_pattern = url_path_join(web_app.settings['base_url'], '/hello')
    web_app.add_handlers(host_pattern, [(route_pattern, HelloWorldHandler)])

Putting this together with the extension code, the example looks like the
following:

.. code:: python

    from notebook.utils import url_path_join
    from notebook.base.handlers import IPythonHandler

    class HelloWorldHandler(IPythonHandler):
        def get(self):
            self.finish('Hello, world!')

    def load_jupyter_server_extension(nb_server_app):
        """
        Called when the extension is loaded.

        Args:
            nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
        """
        web_app = nb_server_app.web_app
        host_pattern = '.*$'
        route_pattern = url_path_join(web_app.settings['base_url'], '/hello')
        web_app.add_handlers(host_pattern, [(route_pattern, HelloWorldHandler)])

References:

1. `Peter Parente's Mindtrove <http://mindtrove.info/4-ways-to-extend-jupyter-notebook/#nb-server-exts>`__
