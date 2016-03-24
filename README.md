# Jupyter Notebook

[![Google Group](https://img.shields.io/badge/-Google%20Group-lightgrey.svg)](https://groups.google.com/forum/#!forum/jupyter)
[![Build Status](https://travis-ci.org/jupyter/notebook.svg?branch=master)](https://travis-ci.org/jupyter/notebook)
[![Documentation Status](https://readthedocs.org/projects/jupyter-notebook/badge/?version=latest)](http://jupyter-notebook.readthedocs.org/en/latest/?badge=latest)

The Jupyter notebook is a web-based notebook environment for interactive
computing.

![Jupyter notebook example](docs/resources/running_code_med.png "Jupyter notebook example")

### Jupyter notebook, the language-agnostic evolution of IPython notebook
Jupyter notebook is the language-agnostic HTML notebook application for
Project Jupyter. In 2015, Jupyter notebook was released as part of
The Big Split™ of the IPython codebase. IPython 3 was the last major monolithic
release containing both language-agnostic code, such as the *IPython notebook*,
and language specific code, such as the *IPython kernel for Python*. As
computing spans many languages, Project Jupyter will continue to develop the
language-agnostic **Jupyter notebook** in this repo and with the help of the
community develop language specific kernels which are found in their own
discrete repos.
[[The Big Split™ announcement](https://blog.jupyter.org/2015/04/15/the-big-split/)]
[[Jupyter Ascending blog post](http://blog.jupyter.org/2015/08/12/first-release-of-jupyter/)]

## Installation
You can find the installation documentation for the
[Jupyter platform, on ReadTheDocs](http://jupyter.readthedocs.org/en/latest/install.html).
The documentation for advanced usage of Jupyter notebook can be found
[here](http://jupyter-notebook.readthedocs.org/en/latest).

For a local installation, make sure you have
[pip installed](https://pip.readthedocs.org/en/stable/installing/) and run:

    $ pip install notebook

## Usage - Running Jupyter notebook

### Running in a local installation

Launch with:

    $ jupyter notebook

### Running in a Docker container

If you are using **Linux** and have a
[Docker daemon running](https://docs.docker.com/installation/),
e.g. reachable on `localhost`, start a container with:

    $ docker run --rm -it -p 8888:8888 -v "$(pwd):/notebooks" jupyter/notebook

In your browser, open the URL `http://localhost:8888/`.
All notebooks from your session will be saved in the current directory.

On other platforms, such as **Windows and OS X**, that use
[`docker-machine`](https://docs.docker.com/machine/install-machine/) with `docker`, a container can be started using
`docker-machine`. In the browser, open the URL `http://ip:8888/` where `ip` is
the IP address returned from the command [`docker-machine ip <MACHINE>`](https://docs.docker.com/machine/reference/ip/):

    $ docker-machine ip <MACHINE>

For example,

    $ docker-machine ip myjupytermachine
    192.168.99.104

In browser, open `http://192.168.99.104:8888`.

NOTE: With the deprecated `boot2docker`, use the command `boot2docker ip` to
determine the URL.

## Development Installation

See [`CONTRIBUTING.rst`](CONTRIBUTING.rst) for how to set up a local development installation.

## Contributing

If you are interested in contributing to the project, see [`CONTRIBUTING.rst`](CONTRIBUTING.rst).

## Resources
- [Project Jupyter website](https://jupyter.org)
- [Online Demo at try.jupyter.org](https://try.jupyter.org)
- [Documentation for Jupyter notebook](http://jupyter-notebook.readthedocs.org/en/latest/) [[PDF](https://media.readthedocs.org/pdf/jupyter-notebook/latest/jupyter-notebook.pdf)]
- [Documentation for Project Jupyter](http://jupyter.readthedocs.org/en/latest/index.html) [[PDF](https://media.readthedocs.org/pdf/jupyter/latest/jupyter.pdf)]
- [Issues](https://github.com/jupyter/notebook/issues)
- [Technical support - Jupyter Google Group](https://groups.google.com/forum/#!forum/jupyter)
