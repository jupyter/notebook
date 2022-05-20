import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISearchProviderRegistry } from '@jupyterlab/documentsearch';

import { Widget } from '@lumino/widgets';

import { INotebookShell } from '@jupyter-notebook/application';

const SEARCHABLE_CLASS = 'jp-mod-searchable';

/**
 * A plugin to add document search functionalities.
 */
const notebookShellWidgetListener: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/documentsearch-extension:notebookShellWidgetListener',
  requires: [INotebookShell, ISearchProviderRegistry],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    notebookShell: INotebookShell,
    registry: ISearchProviderRegistry
  ) => {
    // If a given widget is searchable, apply the searchable class.
    // If it's not searchable, remove the class.
    const transformWidgetSearchability = (widget: Widget | null) => {
      if (!widget) {
        return;
      }
      if (registry.hasProvider(widget)) {
        widget.addClass(SEARCHABLE_CLASS);
      } else {
        widget.removeClass(SEARCHABLE_CLASS);
      }
    };

    // Update searchability of the active widget when the registry
    // changes, in case a provider for the current widget was added
    // or removed
    registry.changed.connect(() =>
      transformWidgetSearchability(notebookShell.currentWidget)
    );

    // Apply the searchable class only to the active widget if it is actually
    // searchable. Remove the searchable class from a widget when it's
    // no longer active.
    notebookShell.currentChanged.connect((_, args) => {
      if (notebookShell.currentWidget) {
        transformWidgetSearchability(notebookShell.currentWidget);
      }
    });
  }
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [notebookShellWidgetListener];

export default plugins;
