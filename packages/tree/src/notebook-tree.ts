import { TabBarSvg } from '@jupyterlab/ui-components';

import { TabPanel, Widget } from '@lumino/widgets';

import { INotebookTree } from './token';

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

  addWidget(widget: Widget, activate=true): void {
    super.addWidget(widget);
    if (activate) this.currentWidget = widget;
  }
}
