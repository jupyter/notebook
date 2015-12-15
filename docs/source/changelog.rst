.. _changelog:

Jupyter notebook changelog
==========================

A summary of changes in the Jupyter notebook.
For more detailed information, see `GitHub <https://github.com/jupyter/notebook>`__.

.. _release-4.1.x:

4.1.0
-----

Numerous bugfixes, including:

- Properly handle reaping of zombie subprocesses.
- Cross-origin fixes
- Fix double-escaping of base URL prefix
- More graceful handling of invalid unicode filenames
- ANSI color-processing fixes


UI Changes:

- Moved the cell toolbar selector into the view menu `[screencast] <https://cloud.githubusercontent.com/assets/335567/10711889/59665a5a-7a3e-11e5-970f-86b89592880c.gif>`__.
- Add Restart & Run All to Kernel menu. Can be added as keyboard shortcut for action ``restart-kernel-and-run-all-cells``.
- Added multiple-cell selection (``Shift-Up/Down`` to extend selection), and actions on multiple-cells, including cut/copy/paste and execute.

  .. image:: /_static/images/multi-select-41.png

- Added a command palette for executing Jupyter actions by name

  .. image:: /_static/images/command-palette-41.png

- Added the find and replace dialog (in the Edit menu or ``F`` in command-mode).

  .. image:: /_static/images/find-replace-41.png

Other improvements:

- Custom KernelManager methods can be Tornado coroutines, allowing async operations.



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
