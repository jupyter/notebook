// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * The default running sessions extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-classic/running-extension:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd): void => {
    console.log('nope');
  }
};

/**
 * Export the plugin as default.
 */
export default plugin;
