# Jupyter Notebook

![Github Actions Status](https://github.com/jupyter/notebook/workflows/Build/badge.svg)
[![Documentation Status](https://readthedocs.org/projects/jupyter-notebook/badge/?version=latest)](https://jupyter-notebook.readthedocs.io/en/latest/?badge=latest)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/jupyter/notebook/main?urlpath=tree)
[![Gitpod](https://img.shields.io/badge/gitpod_editor-open-blue.svg)](https://gitpod.io/#https://github.com/jupyter/notebook)

The Jupyter notebook is a web-based notebook environment for interactive
computing.

![Jupyter notebook example](docs/resources/running_code_med.png 'Jupyter notebook example')

## Maintained versions

We maintain the **two most recently released major versions of Jupyter Notebook**,
Classic Notebook v6 and Notebook v7. Notebook v5 is no longer maintained.
All Notebook v5 users are strongly advised to upgrade to Classic Notebook v6 as soon as possible.

Upgrading to Notebook v7 may require more work, if you use custom extensions, as extensions written
for Notebook v5 or Classic Notebook v6 are not compatible with Notebook v7.

### Notebook v7

The newest major version of Notebook is based on:

- JupyterLab components for the frontend
- Jupyter Server for the Python server

This represents a significant change to the `jupyter/notebook` code base.

To learn more about Notebook v7: https://jupyter.org/enhancement-proposals/79-notebook-v7/notebook-v7.html

### Classic Notebook v6

Maintenance and security-related issues [only](https://github.com/jupyter/notebook-team-compass/issues/5#issuecomment-1085254000) are now being addressed in the [`6.5.x`](https://github.com/jupyter/notebook/tree/6.5.x) branch.
It depends on [`nbclassic`](https://github.com/jupyter/nbclassic) for the HTML/JavaScript/CSS assets.

New features and continuous improvement is now focused on Notebook v7 (see section above).

If you have an open pull request with a new feature or if you were planning to open one, we encourage switching over to the Jupyter Server and JupyterLab architecture, and distribute it as a server extension and / or JupyterLab prebuilt extension. That way your new feature will also be compatible with the new Notebook v7.

## Jupyter notebook, the language-agnostic evolution of IPython notebook

Jupyter notebook is a language-agnostic HTML notebook application for
Project Jupyter. In 2015, Jupyter notebook was released as a part of
The Big Split™ of the IPython codebase. IPython 3 was the last major monolithic
release containing both language-agnostic code, such as the _IPython notebook_,
and language specific code, such as the _IPython kernel for Python_. As
computing spans across many languages, Project Jupyter will continue to develop the
language-agnostic **Jupyter notebook** in this repo and with the help of the
community develop language specific kernels which are found in their own
discrete repos.

- [The Big Split™ announcement](https://blog.jupyter.org/the-big-split-9d7b88a031a7)
- [Jupyter Ascending blog post](https://blog.jupyter.org/jupyter-ascending-1bf5b362d97e)

## Installation

You can find the installation documentation for the
[Jupyter platform, on ReadTheDocs](https://jupyter.readthedocs.io/en/latest/install.html).
The documentation for advanced usage of Jupyter notebook can be found
[here](https://jupyter-notebook.readthedocs.io/en/latest/).

For a local installation, make sure you have
[pip installed](https://pip.readthedocs.io/en/stable/installing/) and run:

```bash
pip install notebook
```

## Usage - Running Jupyter notebook

### Running in a local installation

Launch with:

```bash
jupyter notebook
```
## Installation

### Platform-Specific Installation

#### Windows
1. **Using pip (recommended)**
   - Install Python first from [Python Downloads](https://www.python.org/downloads/windows/)
   - Be sure to check "Add Python to PATH" during installation.
   - Open Command Prompt as Administrator and run:
      ```bash
      pip install notebook
      ```
2. **Using Microsoft Store**
   - Search for "Python" in the Microsoft Store
   - Install Python 3.x
   - Open Command Prompt and run:
     ```bash
     pip install notebook
     ```

#### macOS
1. **Using pip**
   Install Python first if not already installed
   - **Option 1**: Download from [Python Downloads](https://www.python.org/downloads/mac-osx/)
   - **Option 2**: Using Homebrew
     ```bash
     brew install python
     ```
   Then install Jupyter Notebook:
   ```bash
   pip install notebook
   ```
2. **Using Homebrew directly**
   ```bash
   brew install jupyter
   ```

#### Linux
1. **Debian/Ubuntu**
   ```bash
   sudo apt update
   sudo apt install python3-pip
   pip3 install notebook
   ```
2. **Fedora/RHEL/CentOS**
   ```bash
   sudo dnf install python3-pip
   pip3 install notebook
   ```

### Using Conda

Conda is recommended if you need to manage multiple Python environments:
- Install Miniconda or Anaconda first from [Miniconda](https://docs.conda.io/en/latest/miniconda.html)
- Create a new environment (recommended):
  ```bash
  conda create -n jupyter-env python=3.9
  conda activate jupyter-env
  ```
- Install Jupyter Notebook:
  ```bash
  conda install -c conda-forge notebook
  ```

### Common Installation Issues and Solutions

1. **Permission Errors**
   - **Windows**: Run Command Prompt as Administrator
   - **macOS/Linux**: Use `sudo pip install notebook` or `pip install --user notebook`

2. **Outdated pip**
   - Update pip before installation:
     ```bash
     python -m pip install --upgrade pip
     ```

3. **"Command not found" after installation**
   - Make sure Python's script directory is in your PATH
   - **Windows**: Try `py -m notebook` instead of `jupyter notebook`
   - **macOS/Linux**: Try `python3 -m notebook`

4. **Jupyter command not working after installation**
   - Try running:
     ```bash
     python -m notebook
     ```

5. **Dependency conflicts**
   - Use virtual environments:
     ```bash
     python -m venv jupyter-venv
     # On Windows
     jupyter-venv\Scripts\activate
     # On macOS/Linux
     source jupyter-venv/bin/activate
     pip install notebook
     ```

For additional help, visit our [troubleshooting guide](https://jupyter-notebook.readthedocs.io/en/stable/troubleshooting.html) or ask questions on the [Jupyter Community Forum](https://discourse.jupyter.org/).

### Running in a remote installation

You need some configuration before starting Jupyter notebook remotely. See [Running a notebook server](https://jupyter-server.readthedocs.io/en/latest/operators/public-server.html).

## Development Installation

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for how to set up a local development installation.

## Contributing

If you are interested in contributing to the project, see [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Community Guidelines and Code of Conduct

This repository is a Jupyter project and follows the Jupyter
[Community Guides and Code of Conduct](https://jupyter.readthedocs.io/en/latest/community/content-community.html).

## Resources

- [Project Jupyter website](https://jupyter.org)
- [Online Demo at jupyter.org/try](https://jupyter.org/try)
- [Documentation for Jupyter notebook](https://jupyter-notebook.readthedocs.io/en/latest/)
- [Korean Version of Installation](https://github.com/ChungJooHo/Jupyter_Kor_doc/)
- [Documentation for Project Jupyter](https://jupyter.readthedocs.io/en/latest/index.html)
- [Issues](https://github.com/jupyter/notebook/issues)
- [Technical support - Jupyter Google Group](https://discourse.jupyter.org/)

## About the Jupyter Development Team

The Jupyter Development Team is the set of all contributors to the Jupyter project.
This includes all of the Jupyter subprojects.

The core team that coordinates development on GitHub can be found here:
https://github.com/jupyter/.

## Our Copyright Policy

Jupyter uses a shared copyright model. Each contributor maintains copyright
over their contributions to Jupyter. But, it is important to note that these
contributions are typically only changes to the repositories. Thus, the Jupyter
source code, in its entirety is not the copyright of any single person or
institution. Instead, it is the collective copyright of the entire Jupyter
Development Team. If individual contributors want to maintain a record of what
changes/contributions they have specific copyright on, they should indicate
their copyright in the commit message of the change, when they commit the
change to one of the Jupyter repositories.

With this in mind, the following banner should be used in any source code file
to indicate the copyright and license terms:

```
# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.
```
Add enhanced installation instructions
