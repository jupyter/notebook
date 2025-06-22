# Contributing to Jupyter Notebook

Thanks for contributing to Jupyter Notebook!

Make sure to follow [Project Jupyter's Code of Conduct](https://github.com/jupyter/governance/blob/master/conduct/code_of_conduct.md)
for a friendly and welcoming collaborative environment.

## Setting up a development environment

**Note**: you will need Node.js installed to build the extension package.

The `jlpm` command is JupyterLab's pinned version of [yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

**Note**: we recommend using `mamba` to speed up environment creation.

```bash
# Create a new environment
mamba create -n notebook -c conda-forge python nodejs -y

# Activate the environment
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

`notebook` follows a monorepo structure. To build all the packages at once:

```bash
jlpm build
```

There is also a `watch` script to watch for changes and rebuild the app automatically:

```bash
jlpm watch
```

To make sure the `notebook` server extension is enabled:

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

### Local changes in Notebook dependencies

The development installation described above fetches JavaScript dependencies from [npmjs](https://www.npmjs.com/),
according to the versions in the _package.json_ file.
However, it is sometimes useful to be able to test changes in Notebook, with dependencies (e.g., `@jupyterlab` packages) that have not yet
been published.

[yalc](https://github.com/wclr/yalc) can help use local JavaScript packages in your build of
Notebook, acting as a local package repository.

- Install yalc globally in your environment:
  `npm install -g yalc`
- From the package root directory, publish your dependency package:\
  `yalc publish`\
  For instance, if you are developing on _@jupyterlab/ui-components_, this command must be executed from
  _path_to_jupyterlab/packages/ui-components_.
- Depend on this local repository in Notebook:
  - From the Notebook root directory:\
    `yalc add your_package` : this will create a _dependencies_ entry in the main _package.json_ file.\
    With the previous example, it would be `yalc add @jupyterlab/ui-components`.
  - Notebook is a monorepo, so we want this dependency to be 'linked' as a resolution (for all sub-packages) instead
    of a dependency.\
    The easiest way is to manually move the new entry in _package.json_ from _dependencies_ to _resolutions_.
  - Build Notebook with the local dependency:\
    `jlpm install && jlpm build`

Changes in the dependency must then be built and pushed using `jlpm build && yalc push` (from the package root directory),
and fetched from Notebook using `yarn install`.

**Warning**: you need to make sure that the dependencies of Notebook and the local package match correctly.
Otherwise, there will be errors with webpack during build.\
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
# Install required packages for jlpm
jlpm

# Install Playwright
jlpm playwright install

# Start a new Jupyter server in a terminal
jlpm start

# In a new terminal, run the tests
jlpm test
```

The `test` script calls the Playwright test runner. You can pass additional arguments to `playwright` by appending parameters to the command. For example, to run the test in headed mode, `jlpm test --headed`.

Check out the [Playwright Command Line Reference](https://playwright.dev/docs/test-cli/) for more information about the available command line options.

Running the end to end tests in headful mode will trigger something like the following:

![playwright-headed-demo](https://user-images.githubusercontent.com/591645/141274633-ca9f9c2f-eef6-430e-9228-a35827f8133d.gif)

## Tasks caching

The repository is configured to use the Lerna caching system (via `nx`) for some of the development scripts.

This helps speed up rebuilds when running `jlpm run build` multiple times to avoid rebuilding packages that have not changed on disk.

You can generate a graph to have a better idea of the dependencies between all the packages using the following command:

```
npx nx graph
```

Running the command will open a browser tab by default with a graph that looks like the following:

![a screenshot showing the nx task graph](https://github.com/jupyter/notebook/assets/591645/34eb46f0-b0e5-44b6-9430-ae5fbd673a4b)

To learn more about Lerna caching:

- https://lerna.js.org/docs/features/cache-tasks
- https://nx.dev/features/cache-task-results

### Updating reference snapshots

Often a PR might make changes to the user interface, which can cause the visual regression tests to fail.

If you want to update the reference snapshots while working on a PR, you can post the following sentence as a GitHub comment:

```
bot please update playwright snapshots
```

This will trigger a GitHub Action that will run the UI tests automatically and push new commits to the branch if the reference snapshots have changed.

## Code Styling

All non-Python source code is formatted using [Prettier](https://prettier.io) and Python source code is formatted using [Black](https://github.com/psf/black).
When code is modified and committed, all staged files will be
automatically formatted using pre-commit git hooks with help from
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
You may also install [Black integration](https://github.com/psf/black#editor-integration)
into your text editor to format code automatically.

If you have already committed files before setting up the pre-commit
hook with `pre-commit install`, you can fix everything up using
`pre-commit run --all-files`. You'll need to commit the fixes manually after that.

You may also run Prettier using a script (e.g., `npm run prettier`,
`yarn prettier`, or `jlpm prettier`) to format the entire code base.
We recommend installing a Prettier extension for your code editor and
configuring it to format your code with a keyboard shortcut, or
automatically on save.

Some of the hooks only run on CI by default, but you can invoke them by
running with the `--hook-stage manual` argument.

## Documentation

First, make sure you have set up a development environment as described above.

Run the following command to build the docs:

```shell
hatch run docs:build
```

In a separate terminal window, run the following command to serve the documentation:

```shell
hatch run docs:serve
```

Now, open a web browser and navigate to `http://localhost:8000` to access the documentation.

## Contributing from the browser

Alternatively, you can contribute to Jupyter Notebook without setting up a local environment, directly from a web browser:

- [GitHub CodeSpaces](https://github.com/codespaces) is directly integrated into GitHub. This repository uses the [Pixi](https://pixi.sh/) package manager to set up the development environment. To contribute after the Codespace is started:
  - Run `pixi shell` in a terminal to activate the development environment.
  - Use the commands above for building the extension and running the tests, for example: `jlpm build`
  - To start the application: `pixi run start`. A popup should appear with a button to open the Jupyter Notebook in a new browser tab. If the popup does not appear, you can navigate to the "Forwarded ports" panel to find the URL to the application.
- [Gitpod](https://gitpod.io/#https://github.com/jupyter/notebook) integration is enabled. The Gitpod config automatically builds the Jupyter Notebook application and the documentation.
- GitHub’s [built-in editor](https://docs.github.com/en/repositories/working-with-files/managing-files/editing-files) is suitable for contributing small fixes.
- A more advanced [github.dev](https://docs.github.com/en/codespaces/the-githubdev-web-based-editor) editor can be accessed by pressing the dot (.) key while in the Jupyter Notebook GitHub repository.
