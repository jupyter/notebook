# Contextual Help (Pager)

The Contextual Help (also known as the pager) is a feature that displays help documentation and function signatures when you request them in a Jupyter Notebook cell. It provides a convenient way to view documentation without leaving your current context.

```{image} ./_static/images/pager.png

```

## What is the Pager?

The pager displays help content such as:

- Function docstrings and signatures
- Object information
- Module documentation
- Any content typically shown by Python's `help()` function or IPython's `?` and `??` operators

## Default Behavior

By default, the notebook pager opens documentation in the **down area** at the bottom of the notebook interface. This behavior is inherited from the classic Jupyter Notebook interface and keeps your main notebook view uncluttered while providing easy access to help content.

When you use help commands like:

```ipython
# Show help for a function
help(print)

# IPython magic for quick help
print?

# Detailed help with source code
print??
```

The documentation will appear in the collapsible panel at the bottom of the notebook page.

## Configuration Options

You can customize the pager behavior through the notebook settings:

### Opening Help in Different Areas

The pager behavior is controlled by the `openHelpInDownArea` setting:

- **`true` (default)**: Help content opens in the down area
- **`false`**: Help content displays inline within the cell output (like in JupyterLab)

### How to Change the Setting

1. **Via Settings Menu**: Navigate to Settings → Advanced Settings Editor → Notebook
2. **Via Configuration File**: Add the following to your notebook configuration:

```json
{
  "@jupyter-notebook/notebook-extension:pager": {
    "openHelpInDownArea": false
  }
}
```

### Switching to the JupyterLab behavior

If you prefer the JupyterLab approach where help content appears inline with your cell outputs, set `openHelpInDownArea` to `false`. This will display help content directly below the cell that requested it, similar to regular cell output.

Each mode has its own benefits.

**With the Down Area (Default)**

- **Persistent**: Help content stays visible while you work on other cells
- **Organized**: Keeps main notebook area clean and focused
- **Familiar**: Matches classic Jupyter Notebook behavior

**Inline Output**

- **Contextual**: Help appears directly where you requested it
- **JupyterLab-compatible**: Familiar to JupyterLab users
- **Self-contained**: Each cell's help is contained within its output
