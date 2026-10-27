# Neat Notebook

A lightweight active-cell inspector for Jupyter Notebook 7 and JupyterLab 4.
It uses the host's theme, editor, notebook models, translation services, and
settings. There is no server extension, kernel integration, or external service.

## Install the built extension

Requires Notebook 7.5.6+ or JupyterLab 4.5.7+ (not Notebook 6).
Install the wheel into the environment that runs your Jupyter server:

```sh
python -m pip install dist/neat_notebook-0.1.2-py3-none-any.whl
jupyter labextension list
```

Restart Jupyter and reload the browser. End users do not need Node.js or a
JupyterLab rebuild. This project has not been published to PyPI or npm.

### Repair an installation of 0.1.0 on Notebook 7.5

Version 0.1.0 required JupyterLab 4.6.4 and could upgrade it beyond Notebook 7.5's
supported range. Versions 0.1.1 and later correct both the Python dependency and the
frontend's shared-package compatibility ranges. To restore the original
Notebook 7.5.6 / JupyterLab 4.5.7 combination, install the corrected wheel and
restore JupyterLab in the same transaction:

```sh
python -m pip install 'jupyterlab==4.5.7' dist/neat_notebook-0.1.2-py3-none-any.whl
python -m pip check
```

Restart Jupyter afterward. Do not reinstall the 0.1.0 wheel or use `--no-deps`
to hide the conflict.

## Use

Select a cell in command or edit mode. Its ribbon stays at the top of the visible
part of that cell and occupies a separate row above the input, leaving the
existing cell-action toolbar untouched.

While a code cell is running, the ribbon stays with that cell even when
`Shift+Enter`, `Alt+Enter`, or the Run button advances selection. Queuing another
cell does not displace it. When execution ends, the ribbon follows the next
running cell, or the selected cell if none are running. Selection and editor
focus remain controlled by Jupyter.

- Click the task label to edit it. Enter or blur saves; Escape cancels. Clear the
  label to restore its automatic name.
- Automatic names use the first code line starting with `#`, or the nearest
  Markdown heading (including the active Markdown cell), then the cell type.
  Updates appear while typing, including `#Title` without a space.
- The ribbon shows the type, source-line count (one for an empty cell), and cursor
  position while the editor is focused.
- Code states are Not run, Running with elapsed time, Executed, and Modified.
  Completed durations are session-local and disappear after reload. Timing uses
  a monotonic clock and does not write notebook metadata.
- On small screens, type and total lines move into a keyboard-accessible details
  disclosure. The ribbon wraps only when its contents exceed the available width.
- Markdown and Raw cells are non-executable. The ribbon is hidden when printing.

Disable **Show Active Cell Inspector** under **Neat Notebook** in the host's
settings. The plugin ID is `neat-notebook:cell-inspector`.

Explicit labels are stored in `metadata.jupyter.cellInspector.task`. Other
metadata, including `jupyter.source_hidden` and other `cellInspector` keys, is
preserved. No timing information is persisted.

## Relationship to this Notebook fork

The canonical implementation and styles live in this package. The bundled
`@jupyter-notebook/notebook-extension` imports the same implementation through a
small compatibility wrapper, retaining its original plugin ID and setting.
Installing Neat Notebook disables that original plugin through JupyterLab's
`disabledExtensions` metadata, preventing duplicate ribbons. The standalone
extension has its own setting; existing explicit cell labels are shared.

## Build

The layout follows JupyterLab's
[prebuilt extension development guide](https://jupyterlab.readthedocs.io/en/latest/extension/extension_dev.html).
From this directory, with Node.js and the Jupyter environment active:

```sh
python -m pip install build 'jupyter-builder>=1.2.4,<2'
jlpm install
jlpm build:prod
python -m build
```

The wheel and source distribution appear in `dist/`. The package is also a Yarn
workspace in this repository; the root build compiles its shared implementation.
Its TypeScript configuration and Python packaging do not depend on parent files,
so this directory can also be built independently.

## Verify

Install the built wheel into a clean environment with Notebook, JupyterLab, and
ipykernel. Run tests against that environment, not an editable checkout:

```sh
python -m pip install '.[test]' ipykernel
python -m pytest -n 12
jlpm test:types
jlpm playwright install chromium firefox
NEAT_NOTEBOOK_PYTHON=/absolute/path/to/environment/bin/python jlpm test:ui --workers=4
```

The browser suite covers both Notebook and JupyterLab in Chromium and Firefox,
with real kernels, label persistence, active-cell switching, timing, responsive
layout, keyboard use, themes, printing, settings, and disposal. Its unauthenticated
server configuration is for isolated loopback testing only; never use it in production.

### Known host startup issue

Stock Notebook 7.6.3 has a keyboard-shortcut schema-registration race in its
bundled frontend. It can report an undefined `schema` during startup, including
when Neat Notebook is disabled. Neat does not patch installed host assets.
The browser suite first measures an extension-disabled baseline, classifies only
that exact host stack separately, attaches the evidence to its report, and still
fails on every unexpected error. This repository's compatibility commit fixes
the same upstream race for its bundled application.

Uninstall with `python -m pip uninstall neat-notebook`, then restart Jupyter.

Distributed under the BSD-3-Clause license. Derived from this repository's
inspector; this independently installable package is not an official Jupyter product.
