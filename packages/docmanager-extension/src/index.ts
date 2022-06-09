// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ILabStatus,
  JupyterLab,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISessionContextDialogs } from '@jupyterlab/apputils';

import { IChangedArgs, PageConfig, PathExt } from '@jupyterlab/coreutils';

import { DocumentManager, IDocumentManager } from '@jupyterlab/docmanager';

import { IDocumentProviderFactory } from '@jupyterlab/docprovider';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { ITranslator, nullTranslator } from '@jupyterlab/translation';

import { IDisposable } from '@lumino/disposable';

/**
 * Handle dirty state for a context.
 */
function handleContext(
  status: ILabStatus,
  context: DocumentRegistry.Context
): void {
  let disposable: IDisposable | null = null;
  const onStateChanged = (sender: any, args: IChangedArgs<any>) => {
    if (args.name === 'dirty') {
      if (args.newValue === true) {
        if (!disposable) {
          disposable = status.setDirty();
        }
      } else if (disposable) {
        disposable.dispose();
        disposable = null;
      }
    }
  };
  void context.ready.then(() => {
    context.model.stateChanged.connect(onStateChanged);
    if (context.model.dirty) {
      disposable = status.setDirty();
    }
  });
  context.disposed.connect(() => {
    if (disposable) {
      disposable.dispose();
    }
  });
}

/**
 * A plugin providing the default document manager for the
 * notebook application
 */
const manager: JupyterFrontEndPlugin<IDocumentManager> = {
  id: '@jupyter-notebook/docmanager-extension:manager',
  autoStart: true,
  provides: IDocumentManager,
  optional: [
    ITranslator,
    ILabStatus,
    ISessionContextDialogs,
    IDocumentProviderFactory,
    JupyterLab.IInfo
  ],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator | null,
    status: ILabStatus | null,
    sessionDialogs: ISessionContextDialogs | null,
    docProviderFactory: IDocumentProviderFactory | null,
    info: JupyterLab.IInfo | null
  ) => {
    const { serviceManager: manager, docRegistry: registry } = app;
    const contexts = new WeakSet<DocumentRegistry.Context>();
    const when = app.restored.then(() => void 0);
    const baseUrl = PageConfig.getBaseUrl();

    let id = 0;
    const opener: DocumentManager.IWidgetOpener = {
      open: (widget, options) => {
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

        // Handle dirty state for open documents.
        const context = docManager.contextForWidget(widget);
        if (context && !contexts.has(context)) {
          if (status) {
            handleContext(status, context);
          }
          contexts.add(context);
        }
      }
    };

    const docManager = new DocumentManager({
      registry,
      manager,
      opener,
      when,
      setBusy: (status && (() => status.setBusy())) ?? undefined,
      sessionDialogs: sessionDialogs || undefined,
      translator: translator ?? nullTranslator,
      collaborative: true,
      docProviderFactory: docProviderFactory ?? undefined,
      isConnectedCallback: () => {
        if (info) {
          return info.isConnected;
        }
        return true;
      }
    });

    return docManager;
  }
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [manager];

export default plugins;
