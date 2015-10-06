# Jupyter Notebook

[![Google Group](https://img.shields.io/badge/-Google%20Group-lightgrey.svg)](https://groups.google.com/forum/#!forum/jupyter)
[![Build Status](https://travis-ci.org/jupyter/notebook.svg?branch=master)](https://travis-ci.org/jupyter/notebook)
[![Documentation Status](https://readthedocs.org/projects/jupyter-notebook/badge/?version=latest)](http://jupyter-notebook.readthedocs.org/en/latest/?badge=latest)

The Jupyter HTML notebook is a web-based notebook environment for interactive computing.

## Usage

### Local installation

Launch with:

    $ jupyter notebook

### In a Docker container

If you have a [Docker daemon running](https://docs.docker.com/installation/), e.g. reachable on `localhost`, start a container with:

    $ docker run -d -p "8888:8888" --name="myproject" jupyter/notebook

In your browser open the URL `http://localhost:8888/`.

The image defines a [volume](https://docs.docker.com/userguide/dockervolumes/) for notebook files at `/notebooks`.
You can override it to mount a host path, e.g. the current working directory:

    $ docker run -d -p "8888:8888" -v "$(pwd):/notebooks" --name="myproject" jupyter/notebook

## Installation

For a local installation, make sure you have [pip installed](https://pip.readthedocs.org/en/stable/installing/) and run:

    $ pip install notebook

### Dev quickstart

* ensure that you have node/npm installed (e.g. `brew install node` on OS X)
* Clone this repo and cd into it
* `pip install --pre -e .`

_NOTE_: For Debian/Ubuntu systems, if you're installing the system node you need
to use the 'nodejs-legacy' package and not the 'node' package.

### Ubuntu Trusty

```
sudo apt-get install nodejs-legacy npm python-virtualenv python-dev
# ensure setuptools/pip are up-to-date
pip install --upgrade setuptools pip
git clone https://github.com/jupyter/notebook.git
cd notebook
pip install --pre -e .
jupyter notebook
```

### FreeBSD

```
cd /usr/ports/www/npm
sudo make install    # (Be sure to select the "NODE" option)
cd /usr/ports/devel/py-pip
sudo make install
cd /usr/ports/devel/py-virtualenv
sudo make install
cd /usr/ports/shells/bash
sudo make install
mkdir -p ~/.virtualenvs
python2.7 -m virtualenv ~/.virtualenvs/notebook
bash
source ~/.virtualenvs/notebook/bin/activate
pip install --upgrade setuptools pip pycurl
git clone https://github.com/jupyter/notebook.git
cd notebook
pip install -r requirements.txt -e .
jupyter notebook
```
