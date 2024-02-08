# Server Imports in Notebook 7

Notebook 7 is now based on Jupyter Server, which is a new server application that allows to run multiple Jupyter frontends (e.g. Notebook, JupyterLab, NBClassic, etc.) on the same server.

Prior to Notebook 7, the classic notebook server include the server modules in the `notebook` package. This means it was possible to import the server modules from the `notebook` package, for example:

```python
from notebook.auth import passwd
passwd("foo")
```

Or:

```python
from notebook import notebookapp
notebookapp.list_running_servers()
```

In Notebook 7, these server modules are now exposed by the `jupyter_server` package. The code snippets above should be updated to:

```python
from jupyter_server.auth import passwd
passwd("foo")
```

And:

```python
from jupyter_server import serverapp
serverapp.list_running_servers()
```

These are just examples, so you may have to adjust based on the specific server modules you were using.
