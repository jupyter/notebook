# Contributing to Jupyter Notebook

Thanks for contributing to Jupyter Notebook!

Make sure to follow [Project Jupyter's Code of Conduct](https://github.com/jupyter/governance/blob/master/conduct/code_of_conduct.md)
for a friendly and welcoming collaborative environment.

## Setting up a development environment

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of [yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

**Note**: we recomment using `mamba` to speed the creating of the environment.

```bash
# create a new environment
mamba create -n notebook -c conda-forge python nodejs -y

# activate the environment
mamba activate notebook

# Install package in development mode
pip install -e .

# Link the notebook extension and @jupyter-notebook schemas
jlpm develop

# Enable the server extension
jupyter server extension enable notebook
```

`notebook` follows a monorepo structure. To build all the packages at once:

```bash
jlpm build
```

There is also a `watch` script to watch for changes and rebuild the app automatically:

```bash
jlpm watch
```

To make sure the `notebook` server extension is installed:

```bash
$ jupyter server extension list
Config dir: /home/username/.jupyter

Config dir: /home/username/miniforge3/envs/notebook/etc/jupyter
    jupyterlab enabled
    - Validating jupyterlab...
      jupyterlab 3.0.0 OK
    notebook enabled
    - Validating notebook...
      notebook 7.0.0a0 OK

Config dir: /usr/local/etc/jupyter
```

Then start Jupyter Notebook with:

```bash
jupyter notebook
```

## Running Tests

To run the tests:

```bash
jlpm run build:test
jlpm run test
```

There are also end to end tests to cover higher level user interactions, located in the `ui-tests` folder. To run these tests:

```bash
cd ui-tests
# start a new Jupyter server in a terminal
jlpm start

# in a new terminal, run the tests
jlpm test
```

The `test` script calls the Playwright test runner. You can pass additional arguments to `playwright` by appending parameters to the command. For example to run the test in headed mode, `jlpm test --headed`.

Checkout the [Playwright Command Line Reference](https://playwright.dev/docs/test-cli/) for more information about the available command line options.

Running the end to end tests in headful mode will trigger something like the following:

![playwight-headed-demo](https://user-images.githubusercontent.com/591645/141274633-ca9f9c2f-eef6-430e-9228-a35827f8133d.gif)
