# jupyterlab-classic

![Github Actions Status](https://github.com/jtpio/jupyterlab-classic/workflows/Build/badge.svg)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/jtpio/jupyterlab-classic/main?urlpath=classic/notebooks/binder/example.ipynb)

The next gen old-school Notebook UI.

![image](https://user-images.githubusercontent.com/591645/101378325-400fa280-38b3-11eb-81a5-4c7a1aca780e.png)

## Install

**Pre-releases of `jupyterlab-classic` are now available!**

`jupyterlab-classic` can be installed with `pip`:

```bash
pip install jupyterlab-classic --pre
```

And with `conda` (coming soon):

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

### Support for federated extensions 🧩

Install new extensions easily!

![federated-extensions](https://user-images.githubusercontent.com/591645/101954127-dd444100-3bfb-11eb-96be-fee87db5171d.gif)

### Switch between JupyterLab and JupyterLab Classic easily ↔️

![jupyterlab-switch](https://user-images.githubusercontent.com/591645/101954746-ec77be80-3bfc-11eb-85ed-7ac0922e365c.gif)

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
