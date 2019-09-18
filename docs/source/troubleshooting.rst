What to do when things go wrong
===============================

First, have a look at the common problems listed below. If you can figure it out
from these notes, it will be quicker than asking for help.

Check that you have the latest version of any packages that look relevant.
Unfortunately it's not always easy to figure out what packages are relevant,
but if there was a bug that's already been fixed,
it's easy to upgrade and get on with what you wanted to do.

Jupyter fails to start
----------------------

* Have you `installed it <https://jupyter.org/install.html>`__? ;-)
* If you're using a menu shortcut or Anaconda launcher to start it, try
  opening a terminal or command prompt and running the command ``jupyter notebook``.
* If it can't find ``jupyter``,
  you may need to configure your ``PATH`` environment variable.
  If you don't know what that means, and don't want to find out,
  just (re)install Anaconda with the default settings,
  and it should set up PATH correctly.
* If Jupyter gives an error that it can't find ``notebook``,
  check with pip or conda that the ``notebook`` package is installed.
* Try running ``jupyter-notebook`` (with a hyphen). This should normally be the
  same as ``jupyter notebook`` (with a space), but if there's any difference,
  the version with the hyphen is the 'real' launcher, and the other one wraps
  that.

Jupyter doesn't load or doesn't work in the browser
---------------------------------------------------

* Try in another browser (e.g. if you normally use Firefox, try with Chrome).
  This helps pin down where the problem is.
* Try disabling any browser extensions and/or any Jupyter extensions you have
  installed.
* Some internet security software can interfere with Jupyter.
  If you have security software, try turning it off temporarily,
  and look in the settings for a more long-term solution.
* In the address bar, try changing between ``localhost`` and ``127.0.0.1``.
  They should be the same, but in some cases it makes a difference.

Jupyter can't start a kernel
----------------------------

Files called *kernel specs* tell Jupyter how to start different kinds of kernel.
To see where these are on your system, run ``jupyter kernelspec list``::

    $ jupyter kernelspec list
    Available kernels:
      python3      /home/takluyver/.local/lib/python3.6/site-packages/ipykernel/resources
      bash         /home/takluyver/.local/share/jupyter/kernels/bash
      ir           /home/takluyver/.local/share/jupyter/kernels/ir

There's a special fallback for the Python kernel:
if it doesn't find a real kernelspec, but it can import the ``ipykernel`` package,
it provides a kernel which will run in the same Python environment as the notebook server.
A path ending in ``ipykernel/resources``, like in the example above,
is this default kernel.
The default often does what you want,
so if the ``python3`` kernelspec points somewhere else
and you can't start a Python kernel,
try deleting or renaming that kernelspec folder to expose the default.

If your problem is with another kernel, not the Python one we maintain,
you may need to look for support about that kernel.

Asking for help
---------------

As with any problem, try searching to see if someone has already found an answer.
If you can't find an existing answer, you can ask questions at:

* The `jupyter-notebook tag on Stackoverflow <https://stackoverflow.com/questions/tagged/jupyter-notebook>`_
* The `jupyter/help repository on Github <https://github.com/jupyter/help>`_
* Or in an issue on another repository, if it's clear which component is
  responsible.

Don't forget to provide details. What error messages do you see?
What platform are you on? How did you install Jupyter?
What have you tried already?
The ``jupyter troubleshoot`` command collects a lot of information
about your installation, which can be useful.

Remember that it's not anyone's job to help you.
We want Jupyter to work for you,
but we can't always help everyone individually.
