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


## Keyboard shortcuts

### Assigning a shortcut to a command without a default

Not every command has a default keyboard shortcut. For example, **New Console
for Notebook** (available from a notebook's right-click menu) has no shortcut
assigned out of the box, but you can add one yourself in either of two ways.

The quickest way is the add-shortcut tool in the Keyboard Shortcuts settings:
click the **+** button in the toolbar at the top of the shortcuts list, search
for the command by name, and press the key combination you want to assign.
Conflicts with existing shortcuts are flagged as you type so you can adjust
your choice.

Alternatively, you can define the keybinding in JSON using the Advanced
Settings Editor, which is convenient when you want to copy settings between
installations. Add an entry that pairs the command's id with the keys you want:

```json
{
  "shortcuts": [
    {
      "command": "notebook:create-console",
      "keys": ["Accel Shift J"],
      "selector": ".jp-Notebook.jp-mod-commandMode"
    }
  ]
}
```

With this setting, pressing {kbd}`Ctrl+Shift+J` ({kbd}`Cmd+Shift+J` on macOS)
while a notebook is focused in command mode opens a console attached to it.
`Accel` maps to {kbd}`Cmd` on macOS and {kbd}`Ctrl` on other platforms.

To find a command's id, browse the {ref}`command list <commands>` or the
existing entries in the Keyboard Shortcuts settings. When editing the JSON
directly, choose a key combination that is not already bound in the same
context.

## Toolbars, Menu bar and Context Menu

It is also possible to customize toolbars, menus and context menu entries via the Settings Editor.

For example the items of the notebook toolbar can be reordered, or some menu entries can be hidden.

```{note}
Refer to the [JupyterLab Documentation](https://jupyterlab.readthedocs.io/en/latest/user/interface_customization.html)
to learn more about general interface customization via the settings editor.
```
