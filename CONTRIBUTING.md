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
jlpm build
```

There is also a `watch` script to watch for changes and rebuild the app automatically:

```bash
jlpm watch
```

To make sure the `jupyterlab_classic` server extension is installed:

```bash
$ jupyter server extension list
Config dir: /home/username/.jupyter

Config dir: /home/username/miniforge3/envs/jupyterlab-classic/etc/jupyter
    jupyterlab enabled
    - Validating jupyterlab...
      jupyterlab 3.0.0 OK
    jupyterlab_classic enabled
    - Validating jupyterlab_classic...
      jupyterlab_classic 0.1.0rc2 OK
    nbclassic enabled
    - Validating nbclassic...
      nbclassic  OK

Config dir: /usr/local/etc/jupyter
```

Then start JupyterLab Classic with:

```bash
jupyter classic
```

## Running Tests

To run the tests:

```bash
jlpm run build:test
jlpm run test
```

There are also end to end tests to cover higher level user interactions, located in the `app/test` folder. To run these tests:

```bash
# start a new Jupyter server in a terminal
npm start

# run the end to end tests
jlpm run test:e2e

# to run in headful mode
PWDEBUG=1 jlpm run test:e2e

# to run with firefox as the browser
BROWSER=firefox jlpm run test:e2e
```

Running the end to end tests in headful mode will trigger something like the following:

![end-to-end-smoke](https://user-images.githubusercontent.com/591645/106299215-34a67b00-6255-11eb-854c-756a8790246b.gif)
