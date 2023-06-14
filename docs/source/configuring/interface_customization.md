# Interface Customization

Multiple elements in the Notebook interface are customizable to display new elements or hide default ones.

## Layout

By default some widgets are displayed in pre-defined parts of the user interface, which are often called "areas" or "regions". The layout of the application can be customized via the Settings Editor.

For example the notebook component is added to the `main` area when the page is loaded.


```{note}
Please refer to the [JupyterLab Layout Documentation](https://jupyterlab.readthedocs.io/en/latest/user/interface_customization.html#layout)
to know where the default widgets are positioned in the application shell.
```

## Toolbars, Menu bar and Context Menu

It is also possible to customize the toolbars, menu bar and context menu of the application via the Settings Editor.

```{note}
Have a look at the [JupyterLab Documentation](https://jupyterlab.readthedocs.io/en/latest/user/interface_customization.html)
to learn more about interface customization for other UI items such as toolbars, menu items and the context menu.
```

## Examples

### Open the Markdown Preview on the left

It is often useful to be able to see a rendered preview of a Markdown document while editing it.

By default the Markdown Preview opens on the right side of the application. However it is also possible to open it on the left side by changing the Notebook Shell setting in the Advanced Settings Editor:

```json
{
    "layout": {
        "Markdown Preview": {
            "area": "left"
        }
    }
}
```


### Configuring a third-party widget
