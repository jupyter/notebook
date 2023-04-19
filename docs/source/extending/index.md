# Extending the Notebook

```{warning}
Please note that the extension system for Notebook 7 is radically different
from the one used in Notebook 6.5.x and earlier. If you are looking for
information on how to extend the classic Notebook, please refer to the
[documentation for NbClassic](https://nbclassic.readthedocs.io/en/latest/extending/index.html).
```

```{note}
With Notebook 7 being developed on top of JupyterLab and Jupyter Server, the
frontend extension system is now based on the same extension system used by JupyterLab.

Server extensions are also now based on the same system used by Jupyter Server.
You will find below a link to the relevant documentations.
```

Certain subsystems of the notebook server are designed to be extended or
overridden by users. These documents explain these systems, and show how to
override the notebook's defaults with your own custom behavior.

```{toctree}
:maxdepth: 2

Extending the Jupyter Server <https://jupyter-server.readthedocs.io/en/stable/developers/index.html>
frontend_extensions
```
