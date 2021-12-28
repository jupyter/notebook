import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISearchProviderRegistry } from '@jupyterlab/documentsearch';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { Widget } from '@lumino/widgets';

import { IRetroShell } from '@retrolab/application';

const SEARCHABLE_CLASS = 'jp-mod-searchable';

/**
 * A plugin to programmatically disable the Crtl-F shortcut in RetroLab
 * See https://github.com/jupyterlab/retrolab/pull/294 and
 * https://github.com/jupyterlab/jupyterlab/issues/11754 for more context.
 */
const disableShortcut: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/documentsearch-extension:disableShortcut',
  requires: [ISettingRegistry],
  autoStart: true,
  activate: async (app: JupyterFrontEnd, registry: ISettingRegistry) => {
    const docSearchShortcut = registry.plugins[
      '@jupyterlab/documentsearch-extension:plugin'
    ]?.schema['jupyter.lab.shortcuts']?.find(
      shortcut => shortcut.command === 'documentsearch:start'
    );

    if (docSearchShortcut) {
      docSearchShortcut.disabled = true;
      docSearchShortcut.keys = [];
    }
  }
};

/**
 * A plugin to add document search functionalities.
 */
const retroShellWidgetListener: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/documentsearch-extension:retroShellWidgetListener',
  requires: [IRetroShell, ISearchProviderRegistry],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    retroShell: IRetroShell,
    registry: ISearchProviderRegistry
  ) => {
    // If a given widget is searchable, apply the searchable class.
    // If it's not searchable, remove the class.
    const transformWidgetSearchability = (widget: Widget | null) => {
      if (!widget) {
        return;
      }
      const providerForWidget = registry.getProviderForWidget(widget);
      if (providerForWidget) {
        widget.addClass(SEARCHABLE_CLASS);
      }
      if (!providerForWidget) {
        widget.removeClass(SEARCHABLE_CLASS);
      }
    };

    // Update searchability of the active widget when the registry
    // changes, in case a provider for the current widget was added
    // or removed
    registry.changed.connect(() =>
      transformWidgetSearchability(retroShell.currentWidget)
    );

    // Apply the searchable class only to the active widget if it is actually
    // searchable. Remove the searchable class from a widget when it's
    // no longer active.
    retroShell.currentChanged.connect((_, args) => {
      if (retroShell.currentWidget) {
        transformWidgetSearchability(retroShell.currentWidget);
      }
    });
  }
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [
  disableShortcut,
  retroShellWidgetListener
];

export default plugins;
