// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ILabShell,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ICommandPalette, IToolbarWidgetRegistry } from '@jupyterlab/apputils';

import { PageConfig } from '@jupyterlab/coreutils';

import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';

import { ITranslator } from '@jupyterlab/translation';

import { Menu, MenuBar } from '@lumino/widgets';

import { INotebookShell } from '@jupyter-notebook/application';

/**
 * The command IDs used by the application plugin.
 */
namespace CommandIDs {
  /**
   * Launch Jupyter Notebook Tree
   */
  export const launchNotebookTree = 'jupyter-notebook:launch-tree';

  /**
   * Open Jupyter Notebook
   */
  export const openNotebook = 'jupyter-notebook:open-notebook';

  /**
   * Open in JupyterLab
   */
  export const openLab = 'jupyter-notebook:open-lab';
}

interface ISwitcherChoice {
  command: string;
  commandLabel: string;
  buttonLabel: string;
  urlPrefix: string;
}

/**
 * A plugin to add custom toolbar items to the notebook page
 */
const launchButtons: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/lab-extension:interface-switcher',
  autoStart: true,
  requires: [ITranslator],
  optional: [
    INotebookTracker,
    ICommandPalette,
    INotebookShell,
    ILabShell,
    IToolbarWidgetRegistry
  ],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    notebookTracker: INotebookTracker | null,
    palette: ICommandPalette | null,
    notebookShell: INotebookShell | null,
    labShell: ILabShell | null,
    toolbarRegistry: IToolbarWidgetRegistry | null
  ) => {
    if (!notebookTracker) {
      // to prevent showing the toolbar button in non-notebook pages
      return;
    }

    const { commands, shell } = app;
    const baseUrl = PageConfig.getBaseUrl();
    const trans = translator.load('notebook');
    const menubar = new MenuBar();
    const switcher = new Menu({ commands });
    switcher.title.label = trans.__('Interface');
    menubar.addMenu(switcher);

    const isEnabled = () => {
      return (
        notebookTracker.currentWidget !== null &&
        notebookTracker.currentWidget === shell.currentWidget
      );
    };

    const addInterface = (option: ISwitcherChoice) => {
      const { command, commandLabel, urlPrefix } = option;
      commands.addCommand(command, {
        label: args => (args.noLabel ? '' : commandLabel),
        caption: commandLabel,
        execute: () => {
          const current = notebookTracker.currentWidget;
          if (!current) {
            return;
          }
          window.open(`${urlPrefix}${current.context.path}`);
        },
        isEnabled
      });

      if (palette) {
        palette.addItem({ command, category: 'Other' });
      }

      switcher.addItem({ command });
    };

    if (!notebookShell) {
      addInterface({
        command: CommandIDs.openNotebook,
        commandLabel: trans.__('Open With %1', 'Jupyter Notebook'),
        buttonLabel: 'openNotebook',
        urlPrefix: `${baseUrl}tree/`
      });
    }

    if (!labShell) {
      addInterface({
        command: CommandIDs.openLab,
        commandLabel: trans.__('Open With %1', 'JupyterLab'),
        buttonLabel: 'openLab',
        urlPrefix: `${baseUrl}doc/tree/`
      });
    }

    if (toolbarRegistry) {
      toolbarRegistry.addFactory<NotebookPanel>(
        'Notebook',
        'interfaceSwitcher',
        panel => {
          const menubar = new MenuBar();
          menubar.addMenu(switcher);
          menubar.addClass('jp-InterfaceSwitcher');
          return menubar;
        }
      );
    }
  }
};

/**
 * A plugin to add a command to open the Jupyter Notebook Tree.
 */
const launchNotebookTree: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/lab-extension:launch-tree',
  autoStart: true,
  requires: [ITranslator],
  optional: [ICommandPalette],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    palette: ICommandPalette | null
  ): void => {
    const { commands } = app;
    const trans = translator.load('notebook');
    const category = trans.__('Help');

    commands.addCommand(CommandIDs.launchNotebookTree, {
      label: trans.__('Launch Jupyter Notebook File Browser'),
      execute: () => {
        window.open(PageConfig.getBaseUrl() + 'tree');
      }
    });

    if (palette) {
      palette.addItem({ command: CommandIDs.launchNotebookTree, category });
    }
  }
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [
  launchNotebookTree,
  launchButtons
];

export default plugins;
