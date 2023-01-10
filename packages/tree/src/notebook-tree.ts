import { TabBarSvg } from '@jupyterlab/ui-components';

import { TabPanel } from '@lumino/widgets';

import { INotebookTree } from './token';

/**
 * The namespace for command IDs.
 */
export namespace CommandIDs {
  // The command to activate the filebrowser widget in tree view.
  export const activate = 'filebrowser:activate';
}

/**
 * The widget added in main area of the tree view.
 */
export class NotebookTreeWidget extends TabPanel implements INotebookTree {
  /**
   * Constructor of the NotebookTreeWidget.
   */
  constructor() {
    super({
      tabPlacement: 'top',
      tabsMovable: true,
      renderer: TabBarSvg.defaultRenderer
    });
    this.addClass('jp-TreePanel');
  }
}
