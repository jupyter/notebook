(configuration-overview)=

# Configuration Overview

Beyond the default configuration settings, you can configure a rich array of
options to suit your workflow. Here are areas that are commonly configured
when using Jupyter Notebook:

> - {ref}`Jupyter's common configuration system <configure-common>`
> - {ref}`Jupyter Server <configure-jupyter-server>`
> - {ref}`Notebook extensions <configure-nbextensions>`

Let's look at highlights of each area.

(configure-common)=

## Jupyter's Common Configuration system

Jupyter applications, from the Notebook to JupyterHub to nbgrader, share a
common configuration system. The process for creating a configuration file
and editing settings is similar for all the Jupyter applications.

> - [Jupyter’s Common Configuration Approach](https://jupyter.readthedocs.io/en/latest/use/config.html)
> - [Common Directories and File Locations](https://jupyter.readthedocs.io/en/latest/use/jupyter-directories.html)
> - [Language kernels](https://jupyter.readthedocs.io/en/latest/projects/kernels.html)
> - [traitlets](https://traitlets.readthedocs.io/en/latest/config.html#module-traitlets.config)
>   provide a low-level architecture for configuration.

### Disabling Custom CSS

Custom CSS is loaded by default as was done with Jupyter Notebook 6. In the jupyter configuration directory, the `/.jupyter/custom/custom.css` file will be loaded unless the the application is initialized with the `custom_css` flag with the argument set to `False` as in `--JupyterNotebookApp.custom_css=False`.

(configure-jupyter-server)=

## Jupyter server

The Jupyter Server runs the language kernel and communicates with the
front-end Notebook client (i.e. the familiar notebook interface).

> - Configuring the Jupyter Server
>
>   > To create a `jupyter_server_config.py` file in the `.jupyter`
>   > directory, with all the defaults commented out, use the following
>   > command:
>   >
>   > ```
>   > $ jupyter server --generate-config
>   > ```
>
> - [Running a Jupyter Server](https://jupyter-server.readthedocs.io/en/stable/operators/public-server.html)
>
> - Related: [Configuring a language kernel](https://ipython.readthedocs.io/en/latest/install/kernel_install.html)
>   to run in the Jupyter Server enables your server to run other languages, like R or Julia.

```{warning}
Jupyter Notebook 7 is now based on Jupyter Server. This may break some previous `notebook` imports you may have been using, such as `notebook.auth` or `notebook.notebookapp`.

Check out the [migration guide](../migrating/server-imports.md) to learn more on how to update these server imports.
```

(configure-nbextensions)=

## Notebook extensions

The Notebook frontend can be extending with JupyterLab extensions.

See the {ref}`Frontend Extension Guide <frontend-extensions>` for more information.

[Security in Jupyter notebooks:](https://jupyter-server.readthedocs.io/en/stable/operators/security.html)
Since security policies vary from organization to organization, we encourage you to
consult with your security team on settings that would be best for your use
cases. Our documentation offers some responsible security practices, and we
recommend becoming familiar with the practices.
