// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { PageConfig, PathExt } from '@jupyterlab/coreutils';

import { IDocumentWidgetOpener } from '@jupyterlab/docmanager';

import { IDocumentWidget, DocumentRegistry } from '@jupyterlab/docregistry';

import { Signal } from '@lumino/signaling';

/**
 * A plugin to open documents in a new browser tab.
 *
 */
const opener: JupyterFrontEndPlugin<IDocumentWidgetOpener> = {
  id: '@jupyter-notebook/docmanager-extension:opener',
  autoStart: true,
  provides: IDocumentWidgetOpener,
  activate: (app: JupyterFrontEnd) => {
    const baseUrl = PageConfig.getBaseUrl();
    let id = 0;
    return new (class {
      open(widget: IDocumentWidget, options?: DocumentRegistry.IOpenOptions) {
        const widgetName = options?.type;
        const ref = options?.ref;

        if (ref !== '_noref') {
          const path = widget.context.path;
          const ext = PathExt.extname(path);
          let route = 'edit';
          if (
            (widgetName === 'default' && ext === '.ipynb') ||
            widgetName === 'Notebook'
          ) {
            route = 'notebooks';
          }
          let url = `${baseUrl}${route}/${path}`;
          // append ?factory only if it's not the default
          if (widgetName !== 'default') {
            url = `${url}?factory=${widgetName}`;
          }
          window.open(url);
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
          ...widget.title.dataset
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
  }
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [opener];

export default plugins;
