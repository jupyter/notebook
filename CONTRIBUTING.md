# Contributing to Jupyter Notebook

Thanks for contributing to Jupyter Notebook!

Make sure to follow [Project Jupyter's Code of Conduct](https://jupyter.org/governance/conduct/code-of-conduct)
for a friendly and welcoming collaborative environment.

## Setting up a development environment

### Prerequisites

| Tool    | Required Version | How to check       |
| ------- | ---------------- | ------------------ |
| Python  | >= 3.10          | `python --version` |
| Node.js | 22.x             | `node --version`   |

Note: You will need NodeJS to build the extension package.

The `jlpm` command is Jupyter's pinned version of [yarn](https://yarnpkg.com/) that is installed with Jupyter Builder. You may use
`yarn` or `npm` in lieu of `jlpm` below.

### Option A: Using pixi

[pixi](https://pixi.sh/) handles Python, Node.js, and all dependencies in one step. [Install pixi](https://pixi.prefix.dev/latest/#installation), then from the repo root:

```bash
# Install everything and set up the dev environment
pixi install
pixi run develop

# Start the notebook server
pixi run start
```

This installs the correct Python and Node.js versions automatically and links the extension for development.

### Option B: Using mamba/conda

**Note**: we recommend using `mamba` to speed up the creation of the environment.

```bash
# create a new environment
mamba create -n notebook -c conda-forge python nodejs -y

# activate the environment
mamba activate notebook

# Install package in development mode
pip install -e ".[dev,docs,test]"

# Install dependencies and build packages
jlpm
jlpm build

# Link the notebook extension and @jupyter-notebook schemas
jlpm develop

# Enable the server extension
jupyter server extension enable notebook
```

### Option C: Using pip + yarn/npm (no conda)

If you prefer not to use conda/mamba, you can set up the environment with pip and yarn (or npm) directly. Make sure you have Python >= 3.10 and Node.js 22.x installed on your system.

```bash
# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install the package in development mode
pip install -e ".[dev,docs,test]"

# Install JavaScript dependencies (use yarn or npm)
yarn install   # or: npm install
yarn build     # or: npm run build

# Link the notebook extension for development
yarn develop   # or: npm run develop

# Enable the server extension
jupyter server extension enable notebook
```

### Building and running

`notebook` follows a monorepo structure. To build all the packages at once:

```bash
jlpm build
```

There is also a `watch` script to watch for changes and rebuild the app automatically:

```bash
jlpm watch
```

To start the notebook server with development-friendly flags:

```bash
jupyter notebook --no-browser --ServerApp.token='' --NotebookApp.allow_origin='*'
```

This disables the auth token (convenient for local dev) and allows cross-origin requests (useful if you're working with a separate frontend dev server).

### Verifying your setup

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

### Troubleshooting

**`jlpm: command not found`**\
`jlpm` is installed as part of Jupyter Builder. Make sure you ran `pip install -e ".[dev,docs,test]"` first. Alternatively, use `yarn` or `npm` directly.

**JavaScript build fails with missing modules**\
Try clearing the build cache and reinstalling:

```bash
jlpm clean
jlpm
jlpm build
```

**`ModuleNotFoundError` when running `jupyter notebook`**\
Make sure you installed in editable mode (`pip install -e .`) and that your virtual environment is activated.

**Node.js version mismatch**\
This project requires Node.js 22.x. Check with `node --version`. If you're using nvm: `nvm install 22 && nvm use 22`.

**Pre-commit hooks not running**\
Run `pre-commit install` manually. The hooks should have been set up automatically by the dev install, but may need to be reinitialized if you cloned before installing.

### Local changes in Notebook dependencies

The development installation described above fetches JavaScript dependencies from `npm`,
according to the versions in the _package.json_ file.
However, it is sometimes useful to be able to test changes in Notebook, with dependencies (e.g. `@jupyterlab` packages) that have not yet
been published.

[yalc](https://github.com/wclr/yalc) can help you use local JavaScript packages when building Notebook, acting as a local package repository.

- Install yalc globally in your environment:
  `npm install -g yalc`
- Publish your dependency package:\
  `yalc publish`, from the package root directory.\
  For instance, if you are developing on _@jupyterlab/ui-components_, this command must be executed from
  _path_to_jupyterlab/packages/ui-components_.
- Depend on this local repository in Notebook:
  - from the Notebook root directory:\
    `yalc add your_package` : this will create a _dependencies_ entry in the main _package.json_ file.\
    With the previous example, it would be `yalc add @jupyterlab/ui-components`.
  - Notebook is a monorepo, so we want this dependency to be 'linked' as a resolution (for all sub-packages) instead
    of a dependency.\
    The easiest way is to manually move the new entry in _package.json_ from _dependencies_ to _resolutions_.
  - Build Notebook with the local dependency:\
    `jlpm install && jlpm build`

Changes in the dependency must then be built and pushed using `jlpm build && yalc push` (from the package root directory),
and fetched from Notebook using `yarn install`.

**Warning**: you need to make sure that the dependencies of Notebook and the local package match correctly,
otherwise there will be errors with webpack during build.\
In the previous example, both _@jupyterlab/ui-components_ and Notebook depend on _@jupyterlab/coreutils_. We
strongly advise you to depend on the same version.

## Running Tests

To run the tests:

```bash
jlpm run build:test
jlpm run test
```

There are also end to end tests to cover higher level user interactions, located in the `ui-tests` folder. To run these tests:

```bash
cd ui-tests
#install required packages for jlpm
jlpm

#install playwright
jlpm playwright install

# start a new Jupyter server in a terminal
jlpm start

# in a new terminal, run the tests
jlpm test
```

The `test` script calls the Playwright test runner. You can pass additional arguments to `playwright` by appending parameters to the command. For example to run the test in headed mode, `jlpm test --headed`.

Check out the [Playwright Command Line Reference](https://playwright.dev/docs/test-cli/) for more information about the available command line options.

Running the end to end tests in headful mode will trigger something like the following:

![playwright-headed-demo](https://user-images.githubusercontent.com/591645/141274633-ca9f9c2f-eef6-430e-9228-a35827f8133d.gif)

### Updating reference snapshots

Often a PR might make changes to the user interface, which can cause the visual regression tests to fail.

If you want to update the reference snapshots while working on a PR you can post the following sentence as a GitHub comment:

```
bot please update playwright snapshots
```

This will trigger a GitHub Action that will run the UI tests automatically and push new commits to the branch if the reference snapshots have changed.

## Code Styling

All non-python source code is formatted using [prettier](https://prettier.io) and python source code is formatted using [black](https://github.com/psf/black).
When code is modified and committed, all staged files will be
automatically formatted using pre-commit git hooks (with help from
[pre-commit](https://github.com/pre-commit/pre-commit). The benefit of
using code formatters like `prettier` and `black` is that it removes the topic of
code style from the conversation when reviewing pull requests, thereby
speeding up the review process.

As long as your code is valid,
the pre-commit hook should take care of how it should look.
`pre-commit` and its associated hooks will automatically be installed when
you run `pip install -e ".[dev,test]"`

To install `pre-commit` manually, run the following:

```shell
pip install pre-commit
pre-commit install
```

You can invoke the pre-commit hook by hand at any time with:

```shell
pre-commit run
```

which should run any autoformatting on your code
and tell you about any errors it couldn't fix automatically.
You may also install [black integration](https://github.com/psf/black#editor-integration)
into your text editor to format code automatically.

If you have already committed files before setting up the pre-commit
hook with `pre-commit install`, you can fix everything up using
`pre-commit run --all-files`. You need to make the fixing commit
yourself after that.

You may also use the prettier npm script (e.g. `npm run prettier` or
`yarn prettier` or `jlpm prettier`) to format the entire code base.
We recommend installing a prettier extension for your code editor and
configuring it to format your code with a keyboard shortcut, or
automatically on save.

Some of the hooks only run on CI by default, but you can invoke them by
running with the `--hook-stage manual` argument.

## Documentation

First make sure you have set up a development environment as described above.

Then run the following command to build the docs:

```shell
hatch run docs:build
```

In a separate terminal window, run the following command to serve the documentation:

```shell
hatch run docs:serve
```

Now open a web browser and navigate to `http://localhost:8000` to access the documentation.

## Contributing from the browser

Alternatively you can also contribute to Jupyter Notebook without setting up a local environment, directly from a web browser:

- [GitHub CodeSpaces](https://github.com/codespaces) is directly integrated into GitHub. This repository uses the [pixi](https://pixi.sh/) package manager to set up the development environment. To contribute after the Codespace is started:
  - Run `pixi shell` in a terminal to activate the development environment
  - Use the commands above for building the extension and running the tests, for example: `jlpm build`
  - To start the application: `pixi run start`. A popup should appear with a button to open the Jupyter Notebook in a new browser tab. If the popup does not appear, you can navigate to the "Forwarded ports" panel to find the URL to the application.
- GitHub's [built-in editor](https://docs.github.com/en/repositories/working-with-files/managing-files/editing-files) is suitable for contributing small fixes.
- A more advanced [github.dev](https://docs.github.com/en/codespaces/the-githubdev-web-based-editor) editor can be accessed by pressing the dot (.) key while in the Jupyter Notebook GitHub repository
