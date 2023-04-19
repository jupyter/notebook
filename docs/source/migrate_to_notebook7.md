# Migrating to Notebook 7

```{warning}
The Jupyter Notebook application is undergoing a major refactoring to
improve the user experience and to make it easier to maintain and extend.

This set of migration guides are intended to help you migrate your Classic Notebook
setup and extensions to the new Jupyter Notebook 7, which is built on top of JupyterLab 4.
```

## Sunrising the Jupyter Notebook 7

For the past few years, the Classic Jupyter Notebook has been in maintenance mode.

Development has mostly moved to alternative user interfaces like JupyterLab, which is a more
modern and extensible web application. This has resulted in a lot of new
features and improvements in JupyterLab, but also in a lot of new features and
improvements that were not possible to integrate to the Classic Notebook.

For a while the plan was to progressively _sunset_ the Classic Notebook and not maintain it anymore. However, the Classic Notebook is still widely used and it is still the default user interface for Jupyter in many scenarios. Many users and organizations have not been able to switch to JupyterLab yet. For some users, JupyterLab can also be a more complex environment to use, especially for beginners.

Following the feedback from the community, it was decided late 2021 to continue developing the Jupyter Notebook application and _sunrise_ it as Notebook 7. Notebook 7 is built on top of JupyterLab components and delivers new features like realtime collaboration, debugger, and theming.

You can find more details about the changes currently taking place in the Jupyter Ecosystem in the [JEP 79] and [team-compass note].

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
