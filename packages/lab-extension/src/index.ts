// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ILabShell,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { ICommandPalette, IToolbarWidgetRegistry } from '@jupyterlab/apputils';

import { PageConfig } from '@jupyterlab/coreutils';

import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';

import { ITranslator } from '@jupyterlab/translation';

import { Menu, MenuBar } from '@lumino/widgets';

import { INotebookShell } from '@jupyter-notebook/application';

import { caretDownIcon } from '@jupyterlab/ui-components';

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
  commandCaption?: string;
  commandLabel: string;
  commandShortLabel?: string;
  buttonLabel: string;
  urlPrefix: string;
}

/**
 * A plugin to add custom toolbar items to the notebook page
 */
const interfaceSwitcher: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/lab-extension:interface-switcher',
  autoStart: true,
  requires: [ITranslator, INotebookTracker],
  optional: [
    ICommandPalette,
    INotebookShell,
    ILabShell,
    IToolbarWidgetRegistry,
  ],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    notebookTracker: INotebookTracker,
    palette: ICommandPalette | null,
    notebookShell: INotebookShell | null,
    labShell: ILabShell | null,
    toolbarRegistry: IToolbarWidgetRegistry | null
  ) => {
    const { commands, shell } = app;
    const baseUrl = PageConfig.getBaseUrl();
    const trans = translator.load('notebook');
    const overflowOptions = {
      overflowMenuOptions: { isVisible: false },
    };
    const menubar = new MenuBar(overflowOptions);
    const switcher = new Menu({ commands });
    switcher.title.label = trans.__('Open in');
    switcher.title.icon = caretDownIcon;
    menubar.addMenu(switcher);

    const isEnabled = () => {
      return (
        notebookTracker.currentWidget !== null &&
        notebookTracker.currentWidget === shell.currentWidget
      );
    };

    const addInterface = (option: ISwitcherChoice) => {
      const {
        command,
        commandCaption,
        commandLabel,
        commandShortLabel,
        urlPrefix,
      } = option;
      commands.addCommand(command, {
        label: (args) => {
          if (args.noLabel) {
            return '';
          }
          if (args['isPalette']) {
            return commandLabel;
          }
          // For display in the menu, use the short label if provided.
          return commandShortLabel ?? commandLabel;
        },
        caption: commandCaption ?? commandLabel,
        execute: () => {
          const current = notebookTracker.currentWidget;
          if (!current) {
            return;
          }
          window.open(`${urlPrefix}${current.context.path}`);
        },
        isEnabled,
      });

      if (palette) {
        palette.addItem({ command, category: 'Other' });
      }

      switcher.addItem({ command });
    };

    if (!notebookShell) {
      addInterface({
        command: CommandIDs.openNotebook,
        commandCaption: trans.__(
          'Open this notebook in %1',
          'Jupyter Notebook'
        ),
        commandLabel: trans.__('Open in %1', 'Jupyter Notebook'),
        commandShortLabel: trans.__('Notebook'),
        buttonLabel: 'openNotebook',
        urlPrefix: `${baseUrl}tree/`,
      });
    }

    if (!labShell) {
      addInterface({
        command: CommandIDs.openLab,
        commandCaption: trans.__('Open this notebook in %1', 'JupyterLab'),
        commandLabel: trans.__('Open in %1', 'JupyterLab'),
        commandShortLabel: trans.__('JupyterLab'),
        buttonLabel: 'openLab',
        urlPrefix: `${baseUrl}doc/tree/`,
      });
    }

    if (toolbarRegistry) {
      toolbarRegistry.addFactory<NotebookPanel>(
        'Notebook',
        'interfaceSwitcher',
        (panel) => {
          const menubar = new MenuBar(overflowOptions);
          menubar.addMenu(switcher);
          menubar.addClass('jp-InterfaceSwitcher');
          return menubar;
        }
      );
    }
  },
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
      },
    });

    if (palette) {
      palette.addItem({ command: CommandIDs.launchNotebookTree, category });
    }
  },
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [
  launchNotebookTree,
  interfaceSwitcher,
];

export default plugins;
