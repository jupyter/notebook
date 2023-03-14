# What to do when things go wrong

First, have a look at the common problems listed below. If you can figure it out
from these notes, it will be quicker than asking for help.

Check that you have the latest version of any packages that look relevant.
Unfortunately it's not always easy to figure out what packages are relevant,
but if there was a bug that's already been fixed,
it's easy to upgrade and get on with what you wanted to do.

## Jupyter fails to start

- Have you [installed it](https://jupyter.org/install.html)? ;-)
- If you're using a menu shortcut or Anaconda launcher to start it, try
  opening a terminal or command prompt and running the command `jupyter notebook`.
- If it can't find `jupyter`,
  you may need to configure your `PATH` environment variable.
  If you don't know what that means, and don't want to find out,
  just (re)install Anaconda with the default settings,
  and it should set up PATH correctly.
- If Jupyter gives an error that it can't find `notebook`,
  check with pip or conda that the `notebook` package is installed.
- Try running `jupyter-notebook` (with a hyphen). This should normally be the
  same as `jupyter notebook` (with a space), but if there's any difference,
  the version with the hyphen is the 'real' launcher, and the other one wraps
  that.

## Jupyter doesn't load or doesn't work in the browser

- Try in another browser (e.g. if you normally use Firefox, try with Chrome).
  This helps pin down where the problem is.
- Try disabling any browser extensions and/or any Jupyter extensions you have
  installed.
- Some internet security software can interfere with Jupyter.
  If you have security software, try turning it off temporarily,
  and look in the settings for a more long-term solution.
- In the address bar, try changing between `localhost` and `127.0.0.1`.
  They should be the same, but in some cases it makes a difference.

## Jupyter can't start a kernel

Files called _kernel specs_ tell Jupyter how to start different kinds of kernels.
To see where these are on your system, run `jupyter kernelspec list`:

```
$ jupyter kernelspec list
Available kernels:
  python3      /home/takluyver/.local/lib/python3.6/site-packages/ipykernel/resources
  bash         /home/takluyver/.local/share/jupyter/kernels/bash
  ir           /home/takluyver/.local/share/jupyter/kernels/ir
```

There's a special fallback for the Python kernel:
if it doesn't find a real kernelspec, but it can import the `ipykernel` package,
it provides a kernel which will run in the same Python environment as the notebook server.
A path ending in `ipykernel/resources`, like in the example above,
is this default kernel.
The default often does what you want,
so if the `python3` kernelspec points somewhere else
and you can't start a Python kernel,
try deleting or renaming that kernelspec folder to expose the default.

If your problem is with another kernel, not the Python one we maintain,
you may need to look for support about that kernel.

## Python Environments

Multiple python environments, whether based on Anaconda or Python Virtual environments,
are often the source of reported issues. In many cases, these issues stem from the
Notebook server running in one environment, while the kernel and/or its resources,
derive from another environment. Indicators of this scenario include:

- `import` statements within code cells producing `ImportError` or `ModuleNotFound` exceptions.
- General kernel startup failures exhibited by nothing happening when attempting
  to execute a cell.

In these situations, take a close look at your environment structure and ensure all
packages required by your notebook's code are installed in the correct environment.
If you need to run the kernel from different environments than your Notebook
server, check out [IPython's documentation](https://ipython.readthedocs.io/en/stable/install/kernel_install.html#kernels-for-different-environments)
for using kernels from different environments as this is the recommended approach.
Anaconda's [nb_conda_kernels](https://github.com/Anaconda-Platform/nb_conda_kernels)
package might also be an option for you in these scenarios.

Another thing to check is the `kernel.json` file that will be located in the
aforementioned _kernel specs_ directory identified by running `jupyter kernelspec list`.
This file will contain an `argv` stanza that includes the actual command to run
when launching the kernel. Oftentimes, when reinstalling python environments, a previous
`kernel.json` will reference an python executable from an old or non-existent location.
As a result, it's always a good idea when encountering kernel startup issues to validate
the `argv` stanza to ensure all file references exist and are appropriate.

## Windows Systems

Although Jupyter Notebook is primarily developed on the various flavors of the Unix
operating system it also supports Microsoft
Windows - which introduces its own set of commonly encountered issues,
particularly in the areas of security, process management and lower-level libraries.

### pywin32 Issues

The primary package for interacting with Windows' primitives is `pywin32`.

- Issues surrounding the creation of the kernel's communication file utilize
  `jupyter_core`'s `secure_write()` function. This function ensures a file is
  created in which only the owner of the file has access. If libraries like `pywin32`
  are not properly installed, issues can arise when it's necessary to use the native
  Windows libraries.

  Here's a portion of such a traceback:

  ```
  File "c:\users\jovyan\python\myenv.venv\lib\site-packages\jupyter_core\paths.py", line 424, in secure_write
  win32_restrict_file_to_user(fname)
  File "c:\users\jovyan\python\myenv.venv\lib\site-packages\jupyter_core\paths.py", line 359, in win32_restrict_file_to_user
  import win32api
  ImportError: DLL load failed: The specified module could not be found.
  ```

- As noted earlier, the installation of `pywin32` can be problematic on Windows
  configurations. When such an issue occurs, you may need to revisit how the environment
  was setup. Pay careful attention to whether you're running the 32 or 64 bit versions
  of Windows and be sure to install appropriate packages for that environment.

  Here's a portion of such a traceback:

  ```
  File "C:\Users\jovyan\AppData\Roaming\Python\Python37\site-packages\jupyter_core\paths.py", line 435, in secure_write
  win32_restrict_file_to_user(fname)
  File "C:\Users\jovyan\AppData\Roaming\Python\Python37\site-packages\jupyter_core\paths.py", line 361, in win32_restrict_file_to_user
  import win32api
  ImportError: DLL load failed: %1 is not a valid Win32 application
  ```

#### Resolving pywin32 Issues

> In this case, your `pywin32` module may not be installed correctly and the following
> should be attempted:
>
> ```
> pip install --upgrade pywin32
> ```
>
> or:
>
> ```
> conda install --force-reinstall pywin32
> ```
>
> followed by:
>
> ```
> python.exe Scripts/pywin32_postinstall.py -install
> ```
>
> where `Scripts` is located in the active Python's installation location.

- Another common failure specific to Windows environments is the location of various
  python commands. On `*nix` systems, these typically reside in the `bin` directory
  of the active Python environment. However, on Windows, these tend to reside in the
  `Scripts` folder - which is a sibling to `bin`. As a result, when encountering
  kernel startup issues, again, check the `argv` stanza and verify it's pointing to a
  valid file. You may find that it's pointing in `bin` when `Scripts` is correct, or
  the referenced file does not include its `.exe` extension - typically resulting in
  `FileNotFoundError` exceptions.

## This Worked An Hour Ago

The Jupyter stack is very complex and rightfully so, there's a lot going on. On occasion
you might find the system working perfectly well, then, suddenly, you can't get past a
certain cell due to `import` failures. In these situations, it's best to ask yourself
if any new python files were added to your notebook development area.

These issues are usually evident by carefully analyzing the traceback produced in
the notebook error or the Notebook server's command window. In these cases, you'll typically
find the Python kernel code (from `IPython` and `ipykernel`) performing _its_ imports
and notice a file from your Notebook development error included in that traceback followed
by an `AttributeError`:

```
File "C:\Users\jovyan\anaconda3\lib\site-packages\ipykernel\connect.py", line 13, in
from IPython.core.profiledir import ProfileDir
File "C:\Users\jovyan\anaconda3\lib\site-packages\IPython_init.py", line 55, in
from .core.application import Application
...
File "C:\Users\jovyan\anaconda3\lib\site-packages\ipython_genutils\path.py", line 13, in
import random
File "C:\Users\jovyan\Desktop\Notebooks\random.py", line 4, in
rand_set = random.sample(english_words_lower_set, 12)
AttributeError: module 'random' has no attribute 'sample'
```

What has happened is that you have named a file that conflicts with an installed package
that is used by the kernel software and now introduces a conflict preventing the
kernel's startup.

**Resolution**: You'll need to rename your file. A best practice would be to prefix or
_namespace_ your files so as not to conflict with any python package.

## Asking for help

As with any problem, try searching to see if someone has already found an answer.
If you can't find an existing answer, you can ask questions at:

- The [Jupyter Discourse Forum](https://discourse.jupyter.org/)

- The [jupyter-notebook tag on Stackoverflow](https://stackoverflow.com/questions/tagged/jupyter-notebook)

- Peruse the [jupyter/help repository on Github](https://github.com/jupyter/help) (read-only)

- Or in an issue on another repository, if it's clear which component is
  responsible. Typical repositories include:

  > - [jupyter_core](https://github.com/jupyter/jupyter_core) - `secure_write()`
  >   and file path issues
  > - [jupyter_client](https://github.com/jupyter/jupyter_core) - kernel management
  >   issues found in Notebook server's command window.
  > - [IPython](https://github.com/ipython/ipython) and
  >   [ipykernel](https://github.com/ipython/ipykernel) - kernel runtime issues
  >   typically found in Notebook server's command window and/or Notebook cell execution.

### Gathering Information

Should you find that your problem warrants that an issue be opened in
[notebook](https://github.com/jupyter/notebook) please don't forget to provide details
like the following:

- What error messages do you see (within your notebook and, more importantly, in
  the Notebook server's command window)?
- What platform are you on?
- How did you install Jupyter?
- What have you tried already?

The `jupyter troubleshoot` command collects a lot of information
about your installation, which can also be useful.

When providing textual information, it's most helpful if you can _scrape_ the contents
into the issue rather than providing a screenshot. This enables others to select
pieces of that content so they can search more efficiently and try to help.

Remember that it's not anyone's job to help you.
We want Jupyter to work for you,
but we can't always help everyone individually.
