import { ILabShell, LayoutRestorer } from '@jupyterlab/application';
import { WidgetTracker } from '@jupyterlab/apputils';
import { IRestorer } from '@jupyterlab/statedb';
import { Widget } from '@lumino/widgets';
import { INotebookShell } from './shell';

export class NotebookLayoutRestorer extends LayoutRestorer {
  // Override the restore function, that adds widget tracker state to the restorer.
  // This is required to avoid trying to restore the main area widget, which leads to
  // new page opening continuously.
  async restore(
    tracker: WidgetTracker,
    options: IRestorer.IOptions<Widget>
  ): Promise<any> {
    // no-op as we don't want to restore widgets, only the layout.
  }

  save(layout: INotebookShell.ILayout): Promise<void> {
    return super.save(layout as ILabShell.ILayout);
  }
}
