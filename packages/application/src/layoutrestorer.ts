import { LayoutRestorer } from '@jupyterlab/application';
import { WidgetTracker } from '@jupyterlab/apputils';
import { IRestorer } from '@jupyterlab/statedb';
import { Widget } from '@lumino/widgets';

export class NotebookLayoutRestorer extends LayoutRestorer {
  // Override the restore function, that adds widget tracker state to the restorer.
  async restore(
    tracker: WidgetTracker,
    options: IRestorer.IOptions<Widget>
  ): Promise<any> {
    // no-op as we don't want to restore widgets, only the layout.
  }
}
