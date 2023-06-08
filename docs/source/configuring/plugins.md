# Managing plugins

Notebook 7 uses the same extension system as JupyterLab. An extension can provide multiple plugins.

```{note}
See the JupyterLab documentation to learn more about the extension system: https://jupyterlab.readthedocs.io/en/latest/user/extensions.html
```

## Examples

### Disabling the download button

To disable the download entry of file browser context menus, open a terminal and run the following command:

```
jupyter labextension disable @jupyterlab/filebrowser-extension:download
```

Then restart the application and refresh the page.
