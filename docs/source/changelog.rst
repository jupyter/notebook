.. _changelog:

Jupyter notebook changelog
==========================

A summary of changes in the Jupyter notebook.
For more detailed information, see `GitHub <https://github.com/jupyter/notebook>`__.

.. tip::

     Use ``pip install notebook --upgrade`` or ``conda upgrade notebook`` to
     upgrade to the latest release.


.. _release-4.2.1:

4.2.1
-----

4.2.1 is a small bugfix release on 4.2. Highlights:

- Compatibility fixes for some versions of ipywidgets
- Fix for ignored CSS on Windows
- Fix specifying destination when installing nbextensions

.. seealso::

    4.2.1 `on GitHub <https://github.com/jupyter/notebook/milestones/4.2.1>`__.

.. _release-4.2.0:

4.2.0
-----

Release 4.2 adds a new API for enabling and installing extensions.
Extensions can now be enabled at the system-level, rather than just per-user.
An API is defined for installing directly from a Python package, as well.

.. seealso::

    :doc:`./examples/Notebook/rstversions/Distributing Jupyter Extensions as Python Packages`


Highlighted changes:

- Upgrade MathJax to 2.6 to fix vertical-bar appearing on some equations.
- Restore ability for notebook directory to be root (4.1 regression)
- Large outputs are now throttled, reducing the ability of output floods to
  kill the browser.
- Fix the notebook ignoring cell executions while a kernel is starting by queueing the messages.
- Fix handling of url prefixes (e.g. JupyterHub) in terminal and edit pages.
- Support nested SVGs in output.

And various other fixes and improvements.

.. _release-4.1.0:

4.1.0
-----

Bug fixes:

- Properly reap zombie subprocesses
- Fix cross-origin problems
- Fix double-escaping of the base URL prefix
- Handle invalid unicode filenames more gracefully
- Fix ANSI color-processing
- Send keepalive messages for web terminals
- Fix bugs in the notebook tour

UI changes:

- Moved the cell toolbar selector into the *View* menu. Added a button that triggers a "hint" animation to the main toolbar so users can find the new location. (Click here to see a `screencast <https://cloud.githubusercontent.com/assets/335567/10711889/59665a5a-7a3e-11e5-970f-86b89592880c.gif>`__ )

    .. image:: /_static/images/cell-toolbar-41.png

- Added *Restart & Run All* to the *Kernel* menu. Users can also bind it to a keyboard shortcut on action ``restart-kernel-and-run-all-cells``.
- Added multiple-cell selection. Users press ``Shift-Up/Down`` or ``Shift-K/J`` to extend selection in command mode. Various actions such as cut/copy/paste, execute, and cell type conversions apply to all selected cells.

  .. image:: /_static/images/multi-select-41.png

- Added a command palette for executing Jupyter actions by name. Users press ``Cmd/Ctrl-Shift-P`` or click the new command palette icon on the toolbar.

  .. image:: /_static/images/command-palette-41.png

- Added a *Find and Replace* dialog to the *Edit* menu. Users can also press ``F`` in command mode to show the dialog.

  .. image:: /_static/images/find-replace-41.png

Other improvements:

- Custom KernelManager methods can be Tornado coroutines, allowing async operations.
- Make clearing output optional when rewriting input with ``set_next_input(replace=True)``.
- Added support for TLS client authentication via ``--NotebookApp.client-ca``.
- Added tags to ``jupyter/notebook`` releases on DockerHub. ``latest`` continues to track the master branch.

See the 4.1 milestone on GitHub for a complete list of `issues <https://github.com/jupyter/notebook/issues?page=3&q=milestone%3A4.1+is%3Aclosed+is%3Aissue&utf8=%E2%9C%93>`__ and `pull requests <https://github.com/jupyter/notebook/pulls?q=milestone%3A4.1+is%3Aclosed+is%3Apr>`__ handled.

4.0.x
-----

4.0.6
*****

- fix installation of mathjax support files
- fix some double-escape regressions in 4.0.5
- fix a couple of cases where errors could prevent opening a notebook

4.0.5
*****

Security fixes for maliciously crafted files.

- `CVE-2015-6938 <http://www.openwall.com/lists/oss-security/2015/09/02/3>`__: malicious filenames
- `CVE-2015-7337 <http://www.openwall.com/lists/oss-security/2015/09/16/3>`__: malicious binary files in text editor.

Thanks to Jonathan Kamens at Quantopian and Juan Broullón for the reports.


4.0.4
*****

- Fix inclusion of mathjax-safe extension

4.0.2
*****

- Fix launching the notebook on Windows
- Fix the path searched for frontend config


4.0.0
*****

First release of the notebook as a standalone package.
