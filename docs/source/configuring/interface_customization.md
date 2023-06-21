# Interface Customization

Multiple elements in the Notebook interface can be customized via the Settings Editor.

## Layout

By default some widgets are displayed in pre-defined parts of the user interface, which are often called "areas" or "regions".
For example the table of contents will be displayed in the `left` area by default, while the debugger will be displayed in the `right` area.

However the positioning of some of these components can also be customized via the Settings Editor. Below are a few examples of how to do this.

### Open the Markdown Preview on the left

It is often useful to be able to see a rendered preview of a Markdown document while editing it.

By default the Markdown Preview opens on the right side of the application. However it is also possible to open it on the left side by changing the Notebook Shell settings in the Advanced Settings Editor:

```json
{
  "layout": {
    "Markdown Preview": {
      "area": "left"
    }
  }
}
```

![a screenshot showing the markdown preview in Notebook 7](https://github.com/jupyter/notebook/assets/591645/3faf0823-ec6f-4d5f-a66f-d6f53dc383de)

### Configuring a third-party widget

Third-party extensions can also add widgets to the application shell. This is for example the case with the [Voila extension](https://github.com/voila-dashboards/voila), which adds a preview widget to visualize a notebook as a dashboard.

By default in JupyterLab the Voila Preview is added to the `main` area next to the corresponding notebook. With Notebook 7 it is possible to move the Voila Preview to the `right` area by changing the Notebook Shell setting in the Advanced Settings Editor as follows:

```json
{
  "layout": {
    "Voila Preview": {
      "area": "right"
    }
  }
}
```

![a screenshot showing the voila preview in Notebook 7](https://github.com/jupyter/notebook/assets/591645/524ade3b-05de-4d3b-8ff9-089f2d38ac77)

```{note}
Refer to the [JupyterLab Layout Documentation](https://jupyterlab.readthedocs.io/en/latest/user/interface_customization.html#layout)
to learn more about the default positioning of other UI elements.
```

## Toolbars, Menu bar and Context Menu

It is also possible to customize toolbars, menus and context menu entries via the Settings Editor.

For example the items of the notebook toolbar can be reordered, or some menu entries can be hidden.

```{note}
Refer to the [JupyterLab Documentation](https://jupyterlab.readthedocs.io/en/latest/user/interface_customization.html)
to learn more about general interface customization via the settings editor.
```
