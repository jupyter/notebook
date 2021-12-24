// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ILabShell,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ICommandPalette } from '@jupyterlab/apputils';

import { PageConfig } from '@jupyterlab/coreutils';

import { IMainMenu } from '@jupyterlab/mainmenu';

import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';

import { ITranslator } from '@jupyterlab/translation';

import { Menu, MenuBar } from '@lumino/widgets';

import { IRetroShell } from '@retrolab/application';

/**
 * The command IDs used by the application plugin.
 */
namespace CommandIDs {
  /**
   * Launch RetroLab Tree
   */
  export const launchRetroTree = 'retrolab:launch-tree';

  /**
   * Open RetroLab
   */
  export const openRetro = 'retrolab:open-retro';

  /**
   * Open in Classic Notebook
   */
  export const openClassic = 'retrolab:open-classic';

  /**
   * Open in JupyterLab
   */
  export const openLab = 'retrolab:open-lab';
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
  id: '@retrolab/lab-extension:interface-switcher',
  autoStart: true,
  requires: [ITranslator],
  optional: [
    INotebookTracker,
    ICommandPalette,
    IMainMenu,
    IRetroShell,
    ILabShell
  ],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    notebookTracker: INotebookTracker | null,
    palette: ICommandPalette | null,
    menu: IMainMenu | null,
    retroShell: IRetroShell | null,
    labShell: ILabShell | null
  ) => {
    if (!notebookTracker) {
      // to prevent showing the toolbar button in non-notebook pages
      return;
    }

    const { commands, shell } = app;
    const baseUrl = PageConfig.getBaseUrl();
    const trans = translator.load('retrolab');
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
      command: 'retrolab:open-classic',
      commandLabel: trans.__('Open With %1', 'Classic Notebook'),
      buttonLabel: 'openClassic',
      urlPrefix: `${baseUrl}tree/`
    });

    if (!retroShell) {
      addInterface({
        command: 'retrolab:open-retro',
        commandLabel: trans.__('Open With %1', 'RetroLab'),
        buttonLabel: 'openRetro',
        urlPrefix: `${baseUrl}retro/tree/`
      });
    }

    if (!labShell) {
      addInterface({
        command: 'retrolab:open-lab',
        commandLabel: trans.__('Open With %1', 'JupyterLab'),
        buttonLabel: 'openLab',
        urlPrefix: `${baseUrl}doc/tree/`
      });
    }

    notebookTracker.widgetAdded.connect(
      async (sender: INotebookTracker, panel: NotebookPanel) => {
        panel.toolbar.insertBefore('kernelName', 'interface-switcher', menubar);
        await panel.context.ready;
        commands.notifyCommandChanged();
      }
    );
  }
};

/**
 * A plugin to add a command to open the RetroLab Tree.
 */
const launchRetroTree: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/lab-extension:launch-retrotree',
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
    const trans = translator.load('retrolab');
    const category = trans.__('Help');

    commands.addCommand(CommandIDs.launchRetroTree, {
      label: trans.__('Launch RetroLab File Browser'),
      execute: () => {
        window.open(PageConfig.getBaseUrl() + 'retro/tree');
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
