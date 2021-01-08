# jupyterlab-classic

![Github Actions Status](https://github.com/jtpio/jupyterlab-classic/workflows/Build/badge.svg)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gist/jtpio/795608163800b4a7d34d60a015c3d27c/master?urlpath=/classic/tree/tour.ipynb)
[![Binder main](https://img.shields.io/badge/launch-main-E66581.svg?logo=data:image/png;base64,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)](https://mybinder.org/v2/gh/jtpio/jupyterlab-classic/main?urlpath=classic/tree)
[![PyPI](https://img.shields.io/pypi/v/jupyterlab-classic.svg)](https://pypi.org/project/jupyterlab-classic)
[![conda-forge](https://img.shields.io/conda/vn/conda-forge/jupyterlab-classic.svg)](https://anaconda.org/conda-forge/jupyterlab-classic)

The next gen old-school Notebook UI.

![image](https://user-images.githubusercontent.com/591645/101378325-400fa280-38b3-11eb-81a5-4c7a1aca780e.png)

## Install

`jupyterlab-classic` can be installed with `pip`:

```bash
pip install jupyterlab-classic
```

With `mamba`:

```bash
mamba install -c conda-forge jupyterlab-classic
```

With `conda`:

```bash
conda install -c conda-forge jupyterlab-classic
```

## Usage

`jupyterlab-classic` can be started as a standalone app with:

```bash
jupyter classic
```

Existing federated JupyterLab extensions listed via:

```bash
jupyter labextension list
```

Should also be available when starting `jupyterlab-classic`.

### Files 📂 and Running Sessions 🏃‍♀️

![tree](https://user-images.githubusercontent.com/591645/101952684-54c4a100-3bf9-11eb-8031-6900f6d3a445.gif)

### Notebook 📒

![notebook](https://user-images.githubusercontent.com/591645/101953039-efbd7b00-3bf9-11eb-9d34-3cb663a5ac43.gif)

### Open in a new Browser Tab by default

![new-browser-tab](https://user-images.githubusercontent.com/591645/101954309-21374600-3bfc-11eb-80fc-447dce4e6ac6.gif)

### Command Palette 🎨

![command-palette](https://user-images.githubusercontent.com/591645/101953322-72ded100-3bfa-11eb-9b13-3a912e4f6844.gif)

### Themes 🌈

Support for existing JupyterLab themes!

![themes](https://user-images.githubusercontent.com/591645/101953333-75d9c180-3bfa-11eb-868f-af54d1ea7091.gif)

### Zen Mode 😌

![compact-zen-mode](https://user-images.githubusercontent.com/591645/101923740-149cf880-3bd0-11eb-9617-e3349a76d034.gif)

### Terminals 🖥️

![terminals](https://user-images.githubusercontent.com/591645/101954217-fc42d300-3bfb-11eb-84c3-fbf84896b829.gif)

### File Editor 🖊️

![image](https://user-images.githubusercontent.com/591645/101953590-e2ed5700-3bfa-11eb-9fee-0b6d964f0949.png)

### Compact View on Mobile Devices 📱

![mobile](https://user-images.githubusercontent.com/591645/101995448-2793f380-3cca-11eb-8971-067dd068ccbe.gif)

### Support for prebuilt extensions 🧩

Install new extensions easily!

![federated-extensions](https://user-images.githubusercontent.com/591645/101954127-dd444100-3bfb-11eb-96be-fee87db5171d.gif)

### Switch between JupyterLab and JupyterLab Classic easily ↔️

![jupyterlab-switch](https://user-images.githubusercontent.com/591645/101954746-ec77be80-3bfc-11eb-85ed-7ac0922e365c.gif)

## Contributing

If you would like to contribute to the project and set up a development environment, check out [CONTRIBUTING.md](./CONTRIBUTING.md).

## Motivation

JupyterLab is the next-gen UI for Project Jupyter. Currently at version 3.0, it is becoming more mature and provides an advanced computational environment, that can sometimes be compared to what traditional IDEs offer.

However in some cases, having a leaner, simpler, and more focused interface to work on a notebook is really useful.

The single document mode as currently implemented in JupyterLab helps address this issue, but still displays a couple of visual cues that can be distracting to some users.

The goal of the `jupyterlab-classic` project is to provide an alternative JupyterLab distribution with the look and feed of the classic notebook UI, while leveraging the efforts put in the development of JupyterLab itself and its extension system.

Technically speaking, `jupyterlab-classic` reuses **many** of the existing plugins for JupyterLab (notebook, toolbar), and also supports prebuilt (federated) third-party extensions using the new distribution system added in 3.0. That way, extensions built for JupyterLab should also be compatible with `jupyterlab-classic`, as long as they can be added to the application shell provided by JupyterLab Classic.

## Relation to other Jupyter frontends

Jupyterlab Classic is an alternative frontend built using the latest JupyterLab components, with the look and feel of the Classic Jupyter Notebook UI. Below is a short comparison to know where it stands when compared to other Jupyter UI projects:

- Classic Jupyter Notebook - Classic frontend, classic notebook server.
- NBClassic - Classic frontend, new Jupyter Server.
- JupyterLab - Jupyterlab frontend, new Jupyter Server (or Classic Notebook Server). Extensions are not compatible with the Classic Jupyter Notebook since it is built with different components. With version 3.0 onwards, it uses the new Jupyter Server and supports federated extensions that don't need to be rebuilt on the end-user machine.
- Jupyterlab Classic - JupyterLab frontend built with JupyterLab components, with the look and feel of the Classic Notebook. Consistent with the latest version of Jupyterlab. Extensions built for Jupyterlab should work as long as the components they depend on are part of this classic interface (for install JupyterLab Classic doesn't have the `left`, `right` and `bottom` areas).

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
