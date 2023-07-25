# New features in Notebook 7

This document describes the new features in Notebook 7 as originally mentioned in the related Jupyter Enhancement Proposal [JEP 79][jep 79].

```{contents} Table of Contents
:depth: 3
:local:
```

## Debugger

Notebook 7 includes a new debugger that allows you to step through your code cell by cell. You can also set breakpoints and inspect variables.

![a screenshot of the debugger](https://user-images.githubusercontent.com/591645/195543524-e16647a1-a4e0-4832-929d-73d5a77ef001.png)

## Real Time collaboration

Notebook 7 allows for using the real time collaboration extension so you can share your notebook with other users and edit it in real time.

The Real Time Collaboration feature is the same as in JupyterLab and is available as a JupyterLab extension. It is not enabled by default, but you can install with `pip`:

```bash
pip install jupyter-collaboration
```

or with `conda`:

```bash
conda install -c conda-forge jupyter-collaboration
```

After installing the extension, restart the Jupyter Server so the extension can be loaded.

```{note}
It is possible for two users to work on the same notebook using Notebook 7 or JupyterLab.
```

![a screencast showing how users can collaborate on the same document with both Notebook 7 and JupyterLab](https://user-images.githubusercontent.com/591645/229854102-6eed73f4-587f-406e-8ed1-347b788da9ee.gif)

## Table of Contents

Notebook 7 includes a new table of contents extension that allows you to navigate through your notebook using a sidebar. The Table of Contents is built-in and enabled by default, just like in JupyterLab.

![a screenshot of the table of contents](https://user-images.githubusercontent.com/591645/195544813-22e7dec9-846f-4aaa-913a-36a9ed908036.png)

## Theming and Dark Mode

A Dark Theme is now available in the Jupyter Notebook by default. You can also install other themes as JupyterLab extensions.

![a screenshot of the dark theme](https://user-images.githubusercontent.com/591645/229732821-3ab15024-e6d7-414d-94ca-246619da4b67.png)

You can also install many other JupyterLab themes. For example to install the [JupyterLab Night](https://github.com/martinRenou/jupyterlab-night) theme:

```shell
pip install jupyterlab-night
```

Then refresh the page and select the new theme in the settings:

![a screenshot of a custom theme](https://user-images.githubusercontent.com/591645/229733418-db0898b3-7e8c-4db5-98d6-2e9f813ab9e9.png)

## Internationalization

Notebook 7 now provides the ability to set the display language of the user interface.

Users will need to install the language pack as a separate Python package. Language packs are grouped in the [language packs repository on GitHub](https://github.com/jupyterlab/language-packs/), and can be installed with `pip`. For example, it is possible to install the language pack for French (France) using the following command:

```shell
pip install jupyterlab-language-pack-fr-FR
```

After installing the language pack, reload the page and the new language should be available in the settings.

![a screencast showing how to switch the display language in Notebook 7](https://user-images.githubusercontent.com/591645/229734057-e08a2020-58c1-4aa5-b30e-ebb83fcde12c.gif)

```{note}
Notebook 7 and JupyterLab share the same language packs, so it is possible to use the same language pack in both applications.
```

## Accessibility Improvements

The text editor underlying the Jupyter Notebook (CodeMirror 5) had major accessibility issues. Fortunately, this accessibility bottleneck has been unblocked as JupyterLab has been upgraded to use CodeMirror 6, a complete rewrite of the text editor with a strong focus on accessibility. Although this upgrade required extensive codebase modifications, the changes is available with JupyterLab 4. By being built on top of JupyterLab, Jupyter Notebook 7 directly benefits from the CodeMirror 6 upgrade.

## Support for many JupyterLab extensions

Notebook 7 is based on JupyterLab and therefore supports many of the existing JupyterLab extensions.

You can install JupyterLab extensions with `pip` or `conda`. For example to install the LSP (Language Server Protocol) extension for enhanced code completion, you can use the following commands:

```bash
pip install jupyter-lsp
```

```bash
conda install -c conda-forge jupyter-lsp
```

Popular extensions like `nbgrader` and `RISE` have already been ported to work with Notebook 7.

### nbgrader

```{note}
The nbgrader extension is still under active development and a version compatible with Notebook 7 is not yet available on PyPI.
However a version compatible with Notebook 7 will be available before the final release of Notebook 7.
```

![a screenshot showing the nbgrader extension in Notebook 7](https://user-images.githubusercontent.com/32258950/196110653-6556c8d7-b169-4586-b1a1-66b3be05c790.png)

![a second screenshot showing the nbgrader extension in Notebook 7](https://user-images.githubusercontent.com/32258950/196110825-7e3b9237-1064-42be-a629-15a5510a3aee.png)

### RISE

```{warning}
The RISE extension is still under active development and a version compatible with Notebook 7 is not yet available on PyPI.
```

The RISE extension is another popular JupyterLab extension that is being ported to work with Notebook 7. It allows you to turn your Jupyter Notebooks into a slideshow.

The extension is still under [active development](https://github.com/jupyterlab-contrib/rise). When ready, it will be possible to install it with `pip`:

```bash
pip install jupyterlab-rise
```

## A document-centric user experience

Despite all the new features and as stated in [JEP 79][jep 79], Notebook 7 keeps the document-centric user experience of the Classic Notebook:

> The Jupyter Notebook application offers a document-centric user experience. That is, in the Notebook application, the landing page that contains a file manager, running tools tab, and a few optional extras, is a launching point into opening standalone, individual documents. This document-centric experience is important for many users, and that is the first key point this proposal aims to preserve. Notebook v7 will be based on a different JavaScript implementation than v6, but it will preserve the document-centric experience, where each individual notebook opens in a separate browser tab and the visible tools and menus are focused on the open document.

[jep 79]: https://jupyter.org/enhancement-proposals/79-notebook-v7/notebook-v7.html

## Compact View on Mobile Devices

Notebook 7 automatically switches to a more compact layout on mobile devices, making it convenient to run code on the go.

![a screenshot of the compact view on mobile devices](https://user-images.githubusercontent.com/591645/101995448-2793f380-3cca-11eb-8971-067dd068ccbe.gif)

## References

This was just a quick overview of the new features in Notebook 7. For more details, you can check out the following resources:

- The [JupyterLab Documentation](https://jupyterlab.readthedocs.io/en/latest/) is a great resource to learn more about JupyterLab and the extensions available. Since Notebook 7 is based on JupyterLab, many of the features and extensions available for JupyterLab are also available for Notebook 7.
- [Migration Guide](./migrate_to_notebook7.md) for Notebook 7, which explains how to migrate from the Classic Notebook to Notebook 7.
