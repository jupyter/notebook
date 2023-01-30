# Configuration Overview

Beyond the default configuration settings, you can configure a rich array of options to suit your workflow. Here are areas that are commonly configured when using Jupyter Notebook:

Jupyter’s common configuration system

Notebook server

Notebook front-end client

Notebook extensions

Let’s look at highlights of each area.

Jupyter’s Common Configuration system
Jupyter applications, from the Notebook to JupyterHub to nbgrader, share a common configuration system. The process for creating a configuration file and editing settings is similar for all the Jupyter applications.

# Jupyter’s Common Configuration Approach

Common Directories and File Locations

Language kernels

traitlets provide a low-level architecture for configuration.

# Notebook server

The Notebook server runs the language kernel and communicates with the front-end Notebook client (i.e. the familiar notebook interface).

Configuring the Notebook server

To create a jupyter_notebook_config.py file in the .jupyter directory, with all the defaults commented out, use the following command:

```
$ jupyter notebook --generate-config
```

:ref:`Command line arguments for configuration <config>` settings are
documented in the configuration file and the user documentation.
Running a Notebook server

Related: Configuring a language kernel to run in the Notebook server enables your server to run other languages, like R or Julia.

# Notebook front-end client

Configuring the notebook frontend
How front end configuration works
Example - Changing the notebook’s default indentation
Example - Restoring the notebook’s default indentation
Persisting configuration settings

# Notebook extensions

Distributing Jupyter Extensions as Python Packages

Extending the Notebook

Security in Jupyter notebooks: Since security policies vary from organization to organization, we encourage you to consult with your security team on settings that would be best for your use cases. Our documentation offers some responsible security practices, and we recommend becoming familiar with the practices.
