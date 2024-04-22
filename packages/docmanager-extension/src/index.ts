// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { PageConfig, PathExt, URLExt } from '@jupyterlab/coreutils';

import { IDocumentWidgetOpener } from '@jupyterlab/docmanager';

import { IDocumentWidget, DocumentRegistry } from '@jupyterlab/docregistry';

import {
  INotebookPathOpener,
  INotebookShell,
  defaultNotebookPathOpener,
} from '@jupyter-notebook/application';

import { Signal } from '@lumino/signaling';

/**
 * A plugin to open documents in a new browser tab.
 *
 */
const opener: JupyterFrontEndPlugin<IDocumentWidgetOpener> = {
  id: '@jupyter-notebook/docmanager-extension:opener',
  autoStart: true,
  optional: [INotebookPathOpener, INotebookShell],
  provides: IDocumentWidgetOpener,
  description: 'Open documents in a new browser tab',
  activate: (
    app: JupyterFrontEnd,
    notebookPathOpener: INotebookPathOpener,
    notebookShell: INotebookShell | null
  ) => {
    const baseUrl = PageConfig.getBaseUrl();
    const docRegistry = app.docRegistry;
    const pathOpener = notebookPathOpener ?? defaultNotebookPathOpener;
    let id = 0;
    return new (class {
      async open(
        widget: IDocumentWidget,
        options?: DocumentRegistry.IOpenOptions
      ) {
        const widgetName = options?.type ?? '';
        const ref = options?.ref;
        // check if there is an setting override and if it would add the widget in the main area
        const userLayoutArea = notebookShell?.userLayout?.[widgetName]?.area;

        if (ref !== '_noref' && userLayoutArea === undefined) {
          const path = widget.context.path;
          const ext = PathExt.extname(path);
          let route = 'edit';
          if (
            (widgetName === 'default' && ext === '.ipynb') ||
            widgetName.includes('Notebook')
          ) {
            // make sure to save the notebook before opening it in a new tab
            // so the kernel info is saved (if created from the New dropdown)
            if (widget.context.sessionContext.kernelPreference.name) {
              await widget.context.save();
            }
            route = 'notebooks';
          }
          // append ?factory only if it's not the default
          const defaultFactory = docRegistry.defaultWidgetFactory(path);
          let searchParams = undefined;
          if (widgetName !== defaultFactory.name) {
            searchParams = new URLSearchParams({
              factory: widgetName,
            });
          }

          pathOpener.open({
            prefix: URLExt.join(baseUrl, route),
            path,
            searchParams,
          });

          // dispose the widget since it is not used on this page
          widget.dispose();
          return;
        }

        // otherwise open the document on the current page

        if (!widget.id) {
          widget.id = `document-manager-${++id}`;
        }
        widget.title.dataset = {
          type: 'document-title',
          ...widget.title.dataset,
        };
        if (!widget.isAttached) {
          app.shell.add(widget, 'main', options || {});
        }
        app.shell.activateById(widget.id);
        this._opened.emit(widget);
      }

      get opened() {
        return this._opened;
      }

      private _opened = new Signal<this, IDocumentWidget>(this);
    })();
  },
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [opener];

export default plugins;
