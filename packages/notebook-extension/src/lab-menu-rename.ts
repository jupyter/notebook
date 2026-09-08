// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { IMainMenu } from '@jupyterlab/mainmenu';

import { TranslationBundle } from '@jupyterlab/translation';

/**
 * Rename JupyterLab-defined File menu submenus to match Classic Notebook v6
 * wording (jupyter/notebook#6398).
 */
export const renameLabFileMenuItems = (
  mainMenu: IMainMenu,
  trans: TranslationBundle
): void => {
  const renames: Array<{ submenuId: string; label: string }> = [
    {
      submenuId: 'jp-mainmenu-file-notebookexport',
      label: trans.__('Download as'),
    },
  ];

  const items = mainMenu.fileMenu.items;
  for (const rename of renames) {
    for (const item of items) {
      if (item.type === 'submenu' && item.submenu?.id === rename.submenuId) {
        item.submenu.title.label = rename.label;
        break;
      }
    }
  }
};
