.. _configuration-overview:

Configuration Overview
======================

Beyond the default configuration settings, you can configure a rich array of
options to suit your workflow. Here are areas that are commonly configured
when using Jupyter Notebook:

    - :ref:`Jupyter's common configuration system <configure_common>`
    - :ref:`Notebook server <configure_nbserver>`
    - :ref:`Notebook front-end client <configure_nbclient>`
    - :ref:`Notebook extensions <configure_nbextensions>`

Let's look at highlights of each area.

.. _configure_common:

Jupyter's Common Configuration system
-------------------------------------
Jupyter applications, from the Notebook to JupyterHub to nbgrader, share a
common configuration system. The process for creating a configuration file
and editing settings is similar for all the Jupyter applications.

    - `Jupyter’s Common Configuration Approach <https://jupyter.readthedocs.io/en/latest/use/config.html>`_
    - `Common Directories and File Locations <https://jupyter.readthedocs.io/en/latest/use/jupyter-directories.html>`_
    - `Language kernels <https://jupyter.readthedocs.io/en/latest/projects/kernels.html>`_
    - `traitlets <https://traitlets.readthedocs.io/en/latest/config.html#module-traitlets.config>`_
      provide a low-level architecture for configuration.

.. _configure_nbserver:

Notebook server
---------------
The Notebook server runs the language kernel and communicates with the
front-end Notebook client (i.e. the familiar notebook interface).

  - Configuring the Notebook server

      To create a ``jupyter_notebook_config.py`` file in the ``.jupyter``
      directory, with all the defaults commented out, use the following
      command::

            $ jupyter notebook --generate-config

        :ref:`Command line arguments for configuration <config>` settings are
        documented in the configuration file and the user documentation.

  - :ref:`Running a Notebook server <working_remotely>`
  - Related: `Configuring a language kernel <https://jupyter.readthedocs.io/en/latest/install-kernel.html>`_
    to run in the Notebook server enables your server to run other languages, like R or Julia.

.. _configure_nbclient:

Notebook front-end client
-------------------------
- :ref:`How front-end configuration works <frontend_config>`
    * :ref:`Example: Changing the notebook's default indentation setting
      <frontend_config>`
    * :ref:`Example: Restoring the notebook's default indentation setting
      <frontend_config>`
- :ref:`Persisting configuration settings <frontend_config>`

.. _configure_nbextensions:

Notebook extensions
-------------------
- `Distributing Jupyter Extensions as Python Packages <https://jupyter-notebook.readthedocs.io/en/latest/examples/Notebook/Distributing%20Jupyter%20Extensions%20as%20Python%20Packages.html#Distributing-Jupyter-Extensions-as-Python-Packages>`_
- `Extending the Notebook <https://jupyter-notebook.readthedocs.io/en/latest/extending/index.html>`_


:ref:`Security in Jupyter notebooks:  <notebook_security>` Since security
policies vary from organization to organization, we encourage you to
consult with your security team on settings that would be best for your use
cases. Our documentation offers some responsible security practices, and we
recommend becoming familiar with the practices.
