// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ILabShell,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ICommandPalette, IToolbarWidgetRegistry } from '@jupyterlab/apputils';

import { PageConfig } from '@jupyterlab/coreutils';

import { IMainMenu } from '@jupyterlab/mainmenu';

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
  export const launchRetroTree = 'jupyter-notebook:launch-tree';

  /**
   * Open Jupyter Notebook
   */
  export const openRetro = 'jupyter-notebook:open-retro';

  /**
   * Open in Classic Notebook
   */
  export const openClassic = 'jupyter-notebook:open-classic';

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
    IMainMenu,
    INotebookShell,
    ILabShell,
    IToolbarWidgetRegistry
  ],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    notebookTracker: INotebookTracker | null,
    palette: ICommandPalette | null,
    menu: IMainMenu | null,
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
    const trans = translator.load('jupyter-notebook');
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

      if (menu) {
        menu.viewMenu.addGroup([{ command }], 1);
      }

      switcher.addItem({ command });
    };

    // always add Classic
    addInterface({
      command: 'jupyter-notebook:open-classic',
      commandLabel: trans.__('Open With %1', 'Classic Notebook'),
      buttonLabel: 'openClassic',
      urlPrefix: `${baseUrl}tree/`
    });

    if (!notebookShell) {
      addInterface({
        command: 'jupyter-notebook:open-retro',
        commandLabel: trans.__('Open With %1', 'Jupyter Notebook'),
        buttonLabel: 'openRetro',
        urlPrefix: `${baseUrl}tree/`
      });
    }

    if (!labShell) {
      addInterface({
        command: 'jupyter-notebook:open-lab',
        commandLabel: trans.__('Open With %1', 'JupyterLab'),
        buttonLabel: 'openLab',
        urlPrefix: `${baseUrl}doc/tree/`
      });
    }

    if (toolbarRegistry) {
      toolbarRegistry.registerFactory<NotebookPanel>(
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
const launchRetroTree: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/lab-extension:launch-retrotree',
  autoStart: true,
  requires: [ITranslator],
  optional: [IMainMenu, ICommandPalette],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    menu: IMainMenu | null,
    palette: ICommandPalette | null
  ): void => {
    const { commands } = app;
    const trans = translator.load('jupyter-notebook');
    const category = trans.__('Help');

    commands.addCommand(CommandIDs.launchRetroTree, {
      label: trans.__('Launch Jupyter Notebook File Browser'),
      execute: () => {
        window.open(PageConfig.getBaseUrl() + 'tree');
      }
    });

    if (menu) {
      const helpMenu = menu.helpMenu;
      helpMenu.addGroup([{ command: CommandIDs.launchRetroTree }], 1);
    }

    if (palette) {
      palette.addItem({ command: CommandIDs.launchRetroTree, category });
    }
  }
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [launchRetroTree, launchButtons];

export default plugins;
