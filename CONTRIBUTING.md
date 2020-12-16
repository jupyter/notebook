# Contributing to JupyterLab Classic

Thanks for contributing to JupyterLab Classic!

Make sure to follow [Project Jupyter's Code of Conduct](https://github.com/jupyter/governance/blob/master/conduct/code_of_conduct.md)
for a friendly and welcoming collaborative environment.

## Setting up a development environment

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of [yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

**Note**: we recomment using `mamba` to speed the creating of the environment.

```bash
# create a new environment
mamba create -n jupyterlab-classic -c conda-forge python nodejs -y

# activate the environment
conda activate jupyterlab-classic

# Install package in development mode
pip install -e .
```

`jupyterlab-classic` follows a monorepo structure. To build all the packages at once:

```bash
jlpm run build
```

To make sure the `jupyterlab_classic` server extension is installed:

```bash
$ jupyter server extension list
Config dir: /home/username/.jupyter

Config dir: /home/username/miniforge3/envs/jupyterlab-classic/etc/jupyter
    jupyterlab enabled
    - Validating jupyterlab...
      jupyterlab 3.0.0rc13 OK
    jupyterlab_classic enabled
    - Validating jupyterlab_classic...
      jupyterlab_classic 0.1.0rc1 OK
    nbclassic enabled
    - Validating nbclassic...
      nbclassic  OK

Config dir: /usr/local/etc/jupyter
```

Then start JupyterLab Classic with:

```bash
jupyter classic
```
