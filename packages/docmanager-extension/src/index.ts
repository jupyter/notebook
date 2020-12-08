// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { PageConfig } from '@jupyterlab/coreutils';

import { IDocumentManager } from '@jupyterlab/docmanager';

import { toArray } from '@lumino/algorithm';

/**
 * A plugin to open document in a new browser tab.
 *
 * TODO: remove and use a custom doc manager?
 */
const opener: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-classic/docmanager-extension:opener',
  autoStart: true,
  activate: (app: JupyterFrontEnd, docManager: IDocumentManager) => {
    const { commands, shell } = app;
    const baseUrl = PageConfig.getBaseUrl();
    commands.commandExecuted.connect((sender, executedArgs) => {
      const widgets = toArray(shell.widgets('main'));
      const { id, args } = executedArgs;
      const path = args['path'] as string;
      if (id === 'docmanager:open' && widgets.length > 0 && path) {
        window.open(`${baseUrl}classic/notebooks/${path}`, '_blank');
      }
    });
  }
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [opener];

export default plugins;
