import { TabBarSvg } from '@jupyterlab/ui-components';

import { TabPanel } from '@lumino/widgets';

import { INotebookTree } from './token';

export class NotebookTreeWidget extends TabPanel implements INotebookTree {
  constructor() {
    super({
      tabPlacement: 'top',
      tabsMovable: true,
      renderer: TabBarSvg.defaultRenderer
    });
    this.addClass('jp-TreePanel');
  }
}
