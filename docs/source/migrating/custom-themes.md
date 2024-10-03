# Custom themes in Notebook 7

In Notebook 7, the way to create custom themes has changed. This means that custom themes developed for Notebook 6 or earlier will not work with Notebook 7 and upwards.

This is for example the case for community contributed themes such as [jupyter-themes](https://github.com/dunovank/jupyter-themes).

## Using a custom theme

Fortunately installing a custom theme for Notebook 7 is very easy. It is the same process as installing a regular extension.

For example let's say you want to install the [JupyterLab Night](https://github.com/martinRenou/jupyterlab-night) theme. You can do so by running the following command:

```bash
pip install jupyterlab-night
```

Then refresh the page and you should see the new theme available in the settings menu:

![a screencast showing how to install a custom theme](https://user-images.githubusercontent.com/591645/229583076-de3c0541-246f-4781-8941-fcbec2204038.gif)

There are already many themes available on [PyPI](https://pypi.org/search/?q=jupyterlab-theme).

You can also find other themes using the `jupyterlab-theme` topic on GitHub: https://github.com/topics/jupyterlab-theme

For example:

- [https://github.com/johnnybarrels/jupyterlab_onedarkpro](https://github.com/johnnybarrels/jupyterlab_onedarkpro)
- [https://github.com/dunovank/jupyterlab_legos_ui](https://github.com/dunovank/jupyterlab_legos_ui)
- [https://github.com/timkpaine/jupyterlab_miami_nights](https://github.com/timkpaine/jupyterlab_miami_nights)

## Creating a custom theme

Creating a custom theme for Notebook 7 follows the same process as creating a custom theme for JupyterLab 4.

See the {ref}`Frontend Extension Guide <frontend-extensions>` to get you started. When creating the extension, select the `Theme` option in the cookiecutter prompt.
