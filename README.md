# jupyterlab-classic

![Github Actions Status](https://github.com/jtpio/jupyterlab-classic/workflows/Build/badge.svg)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/jtpio/jupyterlab-classic/master?urlpath=classic/notebooks/binder/example.ipynb)

The next gen old-school Notebook UI.

![image](https://user-images.githubusercontent.com/591645/101378325-400fa280-38b3-11eb-81a5-4c7a1aca780e.png)

## Install

With `pip`:

```bash
pip install jupyterlab-classic
```

With `conda`:

```bash
conda install -c conda-forge jupyterlab-classic
```

## Usage

`jupyterlab-classic` can be started as a standalone app with:

```bash
python -m jupyterlab_classic
```

Existing federated JupyterLab extensions listed via:

```bash
jupyter labextension list
```

Should also be available when starting `jupyterlab-classic`.

## Motivation

JupyterLab is the next-gen UI for Project Jupyter. Approaching version 3.0, it is becoming more mature and provides an advanced computational environment, that can sometimes be compared to what traditional IDEs offer.

However in some cases, having a leaner, simpler, and more focused interface to work on a notebook is really useful.

The single document mode as currently implemented in JupyterLab helps address this issue, but still displays a couple of visual cues that can be distracting to some users.

The goal of the `jupyterlab-classic` project is to look as close to the classic notebook UI as possible, while leveraging the efforts put in the development of JupyterLab itself and its extension system.

Technically speaking, `jupyterlab-classic` reuses **many** of the existing plugins for JupyterLab (notebook, toolbar), and also supports pre-built (federated) third-party extensions using the new distribution system added in 3.0. That way, extensions built for JupyterLab should also be compatible with `jupyterlab-classic`, as long as they can be added to the application shell provided by JupyterLab Classic.

## Prior art

This project is mostly a reboot of the two previous attempts at making something similar:

- [simplest-notebook](https://github.com/yuvipanda/simplest-notebook)
- [jupyterlab-clarity-mode](https://github.com/jupytercalpoly/jupyterlab-clarity-mode)

These projects really expressed the need for a stripped down, minimal version of the Jupyter Notebook UI.

`jupyterlab-classic` contributes to that space with the added features:

- Support for existing federated (prebuilt) JupyterLab extensions
- Zen Mode
- Repo structure, similar to JupyterLab
- Reusing as much as possible from upstream JupyterLab
