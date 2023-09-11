# Migrating to Notebook 7

_Updated 2023-05-17_

```{warning}
Version 7 of the Jupyter Notebook application might break your
extensions or other customizations. Please read this page to find out if you
need to take any actions to ensure a smooth, uninterrupted experience.
```

A major upgrade to the Jupyter Notebook interface is coming with Notebook 7! This
upgrade will bring a heap of new features, but will also break backwards
compatibility with many classic Notebook features and customizations.

This set of guides is here to help you migrate your Classic Notebook setup and
extensions to the new Notebook 7.

## What you need to do

For users who don't use extensions or other customizations, you will seamlessly
receive the new Notebook 7 when you `pip install notebook` once version 7 is
released out of beta, along with all its new features, like realtime
collaboration, debugger, and theming.

For users who need to use extensions or other customizations, you have a couple
of options:

- Look for Notebook 7 compatible versions of the extensions you already use,
  and [find replacements for those that are not available]

- If you need to maintain compatibility with the Classic Notebook for extensions
  or other customizations that are critical to your workflows, you can switch to
  [nbclassic], which will provide compatibility with the old notebook interface
  and support during an intermediate transition period to Notebook 7

## Why a new version?

For the past few years, the Classic Jupyter Notebook has been in maintenance
mode.

Development has mostly moved to alternative user interfaces like JupyterLab,
which is a more modern and extensible web application. This has resulted in
a lot of new features and improvements in JupyterLab, but also in a lot of
new features and improvements that were not possible to integrate to the
Classic Notebook.

For a while, the plan was to progressively _sunset_ the Classic Notebook and
not maintain it anymore. However, the Classic Notebook is still widely used
and it is still the default user interface for Jupyter in many scenarios.
Many users and organizations have not been able to switch to JupyterLab yet.
For some users, JupyterLab can also be a more complex environment to use,
especially for beginners.

Following the feedback from the community, it was decided in late 2021 to
continue developing the Jupyter Notebook application and _sunrise_ it as
Notebook 7.

You can find more details about the changes currently taking place in the
Jupyter Ecosystem in the [JEP 79] and [team-compass note].

## New features in Notebook 7

```{toctree}
:maxdepth: 2

notebook_7_features.md
```

## Migration Guides

```{toctree}
:maxdepth: 2

migrating/frontend-extensions.md
migrating/server-extensions.md
migrating/custom-themes.md
migrating/multiple-interfaces.md
```

[jep 79]: https://jupyter.org/enhancement-proposals/79-notebook-v7/notebook-v7.html
[team-compass note]: https://github.com/jupyter/notebook-team-compass/issues/5#issuecomment-1085254000
[find replacements for those that are not available]: https://jupyter-notebook.readthedocs.io/en/latest/migrating/frontend-extensions.html#jupyterlab-equivalent-extensions-to-the-classic-notebook
[nbclassic]: https://github.com/jupyter/nbclassic
