<div align="center">
    <a>
        <img alt="Thesis" src="https://avatars.githubusercontent.com/u/236115142?s=200&v=4" width="110"/>
    </a>
    <h1 style="margin-top:20px;">thesis-notebook</h1>
</div>

<br/>

# Overview

Thesis Notebook is a next-generation scientific notebook built for the age of AI.

Our mission is to help scientists and researchers accelerate discovery.

It is built on a modernized fork of Jupyter Notebook.

![Jupyter notebook example](docs/resources/running_code_med.png 'Jupyter notebook example')

## Development

Developer experience is simple and clean relative to the upstream fork. 

To setup and build your development enviroment: 

```sh
./scripts/rebuild.sh
```

To start the notebook development server from your code:

```sh
./scripts/dev.sh
```

The notebook server will run on port: 8888.

In another terminal to watch for changes w/ auto hot reloading:

```sh
./scripts/watch.sh
```

To cleanly rebuild your environment from scratch:

```sh
./scripts/rebuild.sh
```


## Installation (Coming Soon)

You can find the installation documentation for the
[Jupyter platform, on ReadTheDocs](https://jupyter.readthedocs.io/en/latest/install.html).
The documentation for advanced usage of Jupyter notebook can be found
[here](https://jupyter-notebook.readthedocs.io/en/latest/).

For a local installation, make sure you have
[pip installed](https://pip.readthedocs.io/en/stable/installing/) and run:

(Coming Soon!)
```bash
pip install notebook
```

## Usage - Running Jupyter notebook

### Running in a local installation

Launch with:

```bash
thesis notebook
```

## About the Thesis Team

We are a group of researchers and engineers building the next generation of scientific computing.
Our work centers on reimagining the notebook experience to unlock faster, more autonomous discovery for scientists and practitioners around the world.
https://github.com/jupyter/.

## Copyright Notice

Thesis Notebook is a downstream fork of the Jupyter Notebook project.
Portions of this codebase originate from the Jupyter Development Team and remain
under the terms of the Modified BSD License. Thesis Notebook does not
assert new copyright over upstream Jupyter code; we only retain copyright over
our original modifications.

To clearly distinguish upstream work from Thesis modifications, any file that
contains Jupyter-derived code should begin with the following notice:

To clearly distinguish upstream work from Thesis modifications, any file that
contains Jupyter-derived code should begin with the following notice:

```
# This file is part of Thesis Notebook, a fork of Jupyter Notebook.
# Portions of this file are derived from the Jupyter Notebook project.
#
# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.
```
