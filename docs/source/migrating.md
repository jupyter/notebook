# Migrating to Notebook 7

```{warning}
The Jupyter Notebook application is undergoing a major refactoring to
improve the user experience and to make it easier to maintain and extend.

This set of migration guides are intended to help you migrate your Classic Notebook
setup and extensions to the new Jupyter Notebook 7, which is built on top of JupyterLab 4.
```

## Build Jupyter Notebook v7 off of JupyterLab components

Read more details about the changes currently taking place in the
Jupyter Ecosystem in the [JEP 79] and [team-compass note].

Notebook 7 is built on top of JupyterLab components and delivers new features
like realtime collaboration, debugger, theming.

## Migration Guides

```{toctree}
:maxdepth: 2

migrating/frontend-extensions.md
migrating/server-extensions.md
migrating/multiple-interfaces.md
```

[jep 79]: https://jupyter.org/enhancement-proposals/79-notebook-v7/notebook-v7.html
[team-compass note]: https://github.com/jupyter/notebook-team-compass/issues/5#issuecomment-1085254000
