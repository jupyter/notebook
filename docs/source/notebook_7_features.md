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

The Real Time Collaboration feature is the same as in JupyterLab and is available as a JupyterLab extension. It is not enabled by default, but you can install with `pip` or `conda`:

```bash
pip install jupyter-collaboration
```

```bash
conda install -c conda-forge jupyter-collaboration
```

After installing the extension, restart the Jupyter Server so the extension can be loaded.

```{note}
It is possible for two users to work on the same notebook using Notebook 7 or JupyterLab.
```

TODO: screenshot of the real time collaboration

## Table of Contents

Notebook 7 includes a new table of contents extension that allows you to navigate through your notebook using a sidebar. The Table of Contents is built-in and enabled by default, just like in JupyterLab.

![a screenshot of the table of contents](https://user-images.githubusercontent.com/591645/195544813-22e7dec9-846f-4aaa-913a-36a9ed908036.png)

## Theming and Dark Mode

A Dark Theme is now available in the Jupyter Notebook by default. You can also install other themes as JupyterLab extensions.

TODO: screenshot of the dark theme

TODO: screenshot of a custom theme

## Internationalization

Notebook 7 now provides the ability to set the display language of the user interface.

Users will need to install the language pack as a separate Python package. Language packs are grouped in the [language packs repository on GitHub](https://github.com/jupyterlab/language-packs/), and can be installed with `pip`. For example, it is possible to install the language pack for French (France) using the following command:

```shell
pip install jupyterlab-language-pack-fr-FR
```

After installing the language pack, reload the page and the new language should be available in the settings.

TODO: screenshot

```{note}
Notebook 7 and JupyterLab share the same language packs, so it is possible to use the same language pack in both applications.
```

## Improved Web Content Accessibility Guidelines (WCAG) compliance

Improving the accessibility of Jupyter had long been impeded by significant obstacles. The primary obstacle was that the text editor underlying the Jupyter Notebook (CodeMirror 5) had major accessibility issues.

Fortunately, this accessibility bottleneck has been unblocked as JupyterLab has been upgraded to use CodeMirror 6, a complete rewrite of the text editor with a strong focus on accessibility. Although this upgrade required extensive codebase modifications, the changes is available with JupyterLab 4. By being built on top of JupyterLab, Jupyter Notebook 7 directly benefits from the CodeMirror 6 upgrade.

![Axe Auditor output with the Notebook 7 UI](https://user-images.githubusercontent.com/591645/229613525-764004bd-ac7a-4000-b694-a347709aa826.png)

Check out the related blog post for more details: [Improving the accessibility of Jupyter](https://blog.jupyter.org/improving-the-accessibility-of-jupyter-6c695db518d3).

## Support for many JupyterLab extensions

Notebook 7 is based on JupyterLab and therefore supports many of the existing JupyterLab extensions.

You can install JupyterLab extensions with `pip` or `conda`. For example to install the LSP (Language Server Protocol) extension for enhanced code completion, you can use the following command:

```bash
pip install jupyter-lsp
```

```bash
conda install -c conda-forge jupyter-lsp
```

## A document-centric user experience

Despite all the new features and as stated in [JEP 79][jep 79], Notebook 7 keeps the document-centric user experience of the Classic Notebook:

> The Jupyter Notebook application offers a document-centric user experience. That is, in the Notebook application, the landing page that contains a file manager, running tools tab, and a few optional extras, is a launching point into opening standalone, individual documents. This document-centric experience is important for many users, and that is the first key point this proposal aims to preserve. Notebook v7 will be based on a different JavaScript implementation than v6, but it will preserve the document-centric experience, where each individual notebook opens in a separate browser tab and the visible tools and menus are focused on the open document.

[jep 79]: https://jupyter.org/enhancement-proposals/79-notebook-v7/notebook-v7.html

## Compact View on Mobile Devices
