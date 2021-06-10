// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { ITranslator } from '@jupyterlab/translation';
import { interfaceSwitcher } from './interfaceswitcher';

/**
 * The command IDs used by the application plugin.
 */
namespace CommandIDs {
  /**
   * Toggle Top Bar visibility
   */
  export const launchRetroTree = 'retrolab:launchtree';
}

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
const plugins: JupyterFrontEndPlugin<any>[] = [
  launchRetroTree,
  interfaceSwitcher
];

export default plugins;
