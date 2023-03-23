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

import { INotebookShell } from '@jupyter-notebook/application';

import {
  CommandToolbarButton,
  jupyterIcon,
  LabIcon,
  notebookIcon,
} from '@jupyterlab/ui-components';

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
  urlPrefix: string;
  icon: LabIcon;
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

    const isEnabled = () => {
      return (
        notebookTracker.currentWidget !== null &&
        notebookTracker.currentWidget === shell.currentWidget
      );
    };

    const addInterface = (option: ISwitcherChoice) => {
      const { command, commandLabel, urlPrefix, icon } = option;
      commands.addCommand(command, {
        label: (args) => (args.noLabel ? '' : commandLabel),
        caption: commandLabel,
        icon,
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
    };

    let buttonLabel = '';
    let command = '';

    if (!notebookShell) {
      buttonLabel = 'openNotebook';
      command = CommandIDs.openNotebook;

      addInterface({
        command,
        commandLabel: trans.__('Open with %1', 'Jupyter Notebook'),
        urlPrefix: `${baseUrl}tree/`,
        icon: notebookIcon,
      });
    }

    if (!labShell) {
      buttonLabel = 'openLab';
      command = CommandIDs.openLab;

      addInterface({
        command,
        commandLabel: trans.__('Open with %1', 'JupyterLab'),
        urlPrefix: `${baseUrl}doc/tree/`,
        icon: jupyterIcon,
      });
    }

    notebookTracker.widgetAdded.connect(
      async (sender: INotebookTracker, panel: NotebookPanel) => {
        panel.toolbar.addItem(
          // 'kernelName',
          buttonLabel,
          new CommandToolbarButton({
            commands,
            id: command,
            args: { noLabel: 1 },
          })
        );
        await panel.context.ready;
        commands.notifyCommandChanged();
      }
    );
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
