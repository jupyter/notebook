# Managing plugins

Notebook 7 uses the same extension system as JupyterLab. An extension can provide multiple plugins.

```{note}
See the [JupyterLab documentation](https://jupyterlab.readthedocs.io/en/latest/user/extensions.html) to learn more about the extension system.
```

## Examples

### Disabling the download button

By default Notebook 7 provides a way to download files from the file browser. This functionality consists of a context menu entry and a main menu entry. They are provided by an application plugin that can be disabled.

To disable the download entry of file browser context menus, open a terminal and run the following command:

```text
jupyter labextension disable @jupyterlab/filebrowser-extension:download
```

Then restart the application and refresh the page.
