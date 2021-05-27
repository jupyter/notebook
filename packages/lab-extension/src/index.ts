// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ILabShell,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ICommandPalette, ToolbarButton } from '@jupyterlab/apputils';

import { PageConfig } from '@jupyterlab/coreutils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { IMainMenu } from '@jupyterlab/mainmenu';

import { ITranslator } from '@jupyterlab/translation';

import {
  INotebookModel,
  INotebookTracker,
  NotebookPanel
} from '@jupyterlab/notebook';

import { retroSunIcon } from '@retrolab/ui-components';

import { CommandRegistry } from '@lumino/commands';

import { IDisposable } from '@lumino/disposable';

/**
 * The command IDs used by the application plugin.
 */
namespace CommandIDs {
  /**
   * Toggle Top Bar visibility
   */
  export const openRetro = 'retrolab:open';
  export const launchRetroTree = 'retrolab:launchtree';
}

/**
 * A notebook widget extension that adds a retrolab button to the toolbar.
 */
class RetroButton
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  /**
   * Instantiate a new RetroButton.
   * @param commands The command registry.
   */
  constructor(commands: CommandRegistry) {
    this._commands = commands;
  }

  /**
   * Create a new extension object.
   */
  createNew(panel: NotebookPanel): IDisposable {
    const button = new ToolbarButton({
      tooltip: 'Open with RetroLab',
      icon: retroSunIcon,
      onClick: () => {
        this._commands.execute(CommandIDs.openRetro);
      }
    });
    panel.toolbar.insertAfter('cellType', 'retro', button);
    return button;
  }

  private _commands: CommandRegistry;
}

/**
 * A plugin for the checkpoint indicator
 */
const openRetro: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/lab-extension:open-retro',
  autoStart: true,
  optional: [INotebookTracker, ICommandPalette, IMainMenu, ILabShell],
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker | null,
    palette: ICommandPalette | null,
    menu: IMainMenu | null,
    labShell: ILabShell | null
  ) => {
    // TODO: do not activate if already in a IRetroShell?
    if (!notebookTracker || !labShell) {
      // to prevent showing the toolbar button in RetroLab
      return;
    }

    const { commands, docRegistry, shell } = app;
    const baseUrl = PageConfig.getBaseUrl();

    const isEnabled = () => {
      return (
        notebookTracker.currentWidget !== null &&
        notebookTracker.currentWidget === shell.currentWidget
      );
    };

    commands.addCommand(CommandIDs.openRetro, {
      label: 'Open in RetroLab',
      execute: () => {
        const current = notebookTracker.currentWidget;
        if (!current) {
          return;
        }
        const { context } = current;
        window.open(`${baseUrl}retro/notebooks/${context.path}`);
      },
      isEnabled
    });

    if (palette) {
      palette.addItem({ command: CommandIDs.openRetro, category: 'Other' });
    }

    if (menu) {
      menu.viewMenu.addGroup([{ command: CommandIDs.openRetro }], 1);
    }

    const retroButton = new RetroButton(commands);
    docRegistry.addWidgetExtension('Notebook', retroButton);
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
    const trans = translator.load('jupyterlab');
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
const plugins: JupyterFrontEndPlugin<any>[] = [launchRetroTree, openRetro];

export default plugins;
