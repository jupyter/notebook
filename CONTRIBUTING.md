# Contributing to Jupyter Notebook

Thank you for your interest in contributing to Jupyter Notebook!

Please ensure you follow [Project Jupyter's Code of Conduct](https://github.com/jupyter/governance/blob/master/conduct/code_of_conduct.md) to maintain a friendly and welcoming collaborative environment.

## Setting Up a Development Environment

> **Note:** You will need Node.js to build the extension package.

The `jlpm` command is JupyterLab's pinned version of [yarn](https://yarnpkg.com/), which is installed with JupyterLab. You may use `yarn` or `npm` instead of `jlpm` for the commands below.

We recommend using [mamba](https://mamba.readthedocs.io/en/latest/) to speed up environment creation.

```bash
# Create a new environment
mamba create -n notebook -c conda-forge python nodejs -y

# Activate the environment
mamba activate notebook

# Install the package in development mode
pip install -e ".[dev,docs,test]"

# Install dependencies and build packages
jlpm
jlpm build

# Link the notebook extension and @jupyter-notebook schemas
jlpm develop

# Enable the server extension
jupyter server extension enable notebook
```

The `notebook` repository follows a monorepo structure. To build all packages at once, run:

```bash
jlpm build
```

To automatically rebuild the app when changes are detected, use the watch script:

```bash
jlpm watch
```

To verify the `notebook` server extension is installed:

```bash
jupyter server extension list
```

Example output:
```
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

To start Jupyter Notebook:

```bash
jupyter notebook
```

---

### Using Local Changes in Notebook Dependencies

By default, the development installation fetches JavaScript dependencies from [npmjs](https://www.npmjs.com/) as specified in the _package.json_ file. Sometimes, you may want to test Jupyter Notebook against local versions of dependencies (e.g., `@jupyterlab` packages) that haven't been published yet.

[yalc](https://github.com/wclr/yalc) can help you use local JavaScript packages when building Notebook, acting as a local package repository.

Steps:
- Install yalc globally:
  ```bash
  npm install -g yalc
  ```
- Publish your dependency package from its root directory:
  ```bash
  yalc publish
  ```
  For example, if you are working on _@jupyterlab/ui-components_, run this from _path_to_jupyterlab/packages/ui-components_.
- Add the local package to Notebook:
  ```bash
  yalc add your_package
  ```
  This will add a _dependencies_ entry in the main _package.json_. For example, `yalc add @jupyterlab/ui-components`.
- Since Notebook is a monorepo, move the new entry in _package.json_ from _dependencies_ to _resolutions_.
- Build Notebook with the local dependency:
  ```bash
  jlpm install && jlpm build
  ```

When you update the dependency, build and push it:
```bash
jlpm build && yalc push
```
Then, in Notebook, fetch the update:
```bash
yarn install
```

> **Warning:** Ensure that Notebook and the local package have compatible dependencies, or you may encounter webpack errors during build. For example, both _@jupyterlab/ui-components_ and Notebook depend on _@jupyterlab/coreutils_; they should use the same version.

---

## Running Tests

To run the tests:

```bash
jlpm run build:test
jlpm run test
```

End-to-end tests, covering high-level user interactions, are located in the `ui-tests` folder. To run these tests:

```bash
cd ui-tests
jlpm           # Install required packages
jlpm playwright install   # Install Playwright

# Start a new Jupyter server in one terminal
jlpm start

# In another terminal, run the tests
jlpm test
```

The `test` script calls the Playwright test runner. You may pass additional arguments to Playwright by appending parameters. For example, to run tests in headed mode:

```bash
jlpm test --headed
```

See the [Playwright Command Line Reference](https://playwright.dev/docs/test-cli/) for more options.

Running end-to-end tests in headed mode will show something like:

![playwright-headed-demo](https://user-images.githubusercontent.com/591645/141274633-ca9f9c2f-eef6-430e-9228-a35827f8133d.gif)

---

## Task Caching

This repository uses Lerna's caching system (via `nx`) for development scripts, which speeds up rebuilds by avoiding unnecessary work.

To visualize package dependencies, run:

```bash
npx nx graph
```

This opens a browser tab showing a graph similar to:

![nx task graph screenshot](https://github.com/jupyter/notebook/assets/591645/34eb46f0-b0e5-44b6-9430-ae5fbd673a4b)

Learn more about Lerna caching:
- [Lerna cache tasks](https://lerna.js.org/docs/features/cache-tasks)
- [Nx cache task results](https://nx.dev/features/cache-task-results)

---

### Updating Reference Snapshots

Changes to the UI may cause visual regression tests to fail. To update reference snapshots while working on a PR, post this sentence as a GitHub comment:

```
bot please update playwright snapshots
```

This will trigger a GitHub Action that runs UI tests and pushes new commits to the branch if snapshots have changed.

---

## Code Styling

- All non-Python code is formatted with [Prettier](https://prettier.io).
- Python code is formatted with [Black](https://github.com/psf/black).
- All staged files are automatically formatted via pre-commit git hooks (using [pre-commit](https://github.com/pre-commit/pre-commit)).

This ensures code style does not distract from code review discussions and speeds up the review process.

Pre-commit hooks and their dependencies are automatically installed when you run:

```bash
pip install -e ".[dev,test]"
```

To manually install `pre-commit`:

```bash
pip install pre-commit
pre-commit install
```

To run the pre-commit hook manually:

```bash
pre-commit run
```

This will autoformat your code and report any errors it couldn't fix automatically. You can also install [Black integration](https://github.com/psf/black#editor-integration) in your editor for automatic formatting.

If you committed files before installing the pre-commit hook, fix everything by running:

```bash
pre-commit run --all-files
```

Remember to commit the fixes yourself after running the command.

You may run Prettier across the codebase using:

- `npm run prettier`
- `yarn prettier`
- `jlpm prettier`

We recommend installing a Prettier extension for your editor and configuring it to format code on save or via shortcut.

Some hooks only run on CI by default, but you can trigger them manually with:

```bash
pre-commit run --hook-stage manual
```

---

## Documentation

After setting up your development environment, build the docs with:

```bash
hatch run docs:build
```

Then, in a separate terminal, serve the docs:

```bash
hatch run docs:serve
```

Open `http://localhost:8000` in your browser to view the documentation.

---

## Contributing from the Browser

You can also contribute to Jupyter Notebook directly from your browser without setting up a local environment:

- [GitHub CodeSpaces](https://github.com/codespaces): Integrated with GitHub. This repository uses the [pixi](https://pixi.sh/) package manager. After starting the Codespace:
  - Run `pixi shell` in the terminal to activate the environment.
  - Use the build and test commands described above, e.g. `jlpm build`.
  - To start the app: `pixi run start`. A popup should appear with a button to open Jupyter Notebook in a new tab. If not, check the "Forwarded ports" panel for the URL.
- [Gitpod](https://gitpod.io/#https://github.com/jupyter/notebook): Integration is enabled. The Gitpod config automatically builds the application and documentation.
- GitHub’s [built-in editor](https://docs.github.com/en/repositories/working-with-files/managing-files/editing-files) is suitable for small fixes.
- For a more advanced editor, press `.` while in the Jupyter Notebook repository to launch [github.dev](https://docs.github.com/en/codespaces/the-githubdev-web-based-editor).
