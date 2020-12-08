// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IRunningSessionManagers, RunningSessions } from '@jupyterlab/running';

import { ITranslator } from '@jupyterlab/translation';

/**
 * The default running sessions extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-classic/running-extension:plugin',
  requires: [IRunningSessionManagers],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    manager: IRunningSessionManagers,
    translator: ITranslator
  ): void => {
    const running = new RunningSessions(manager, translator);
    running.id = 'jp-running-sessions';

    // re-add the widget to the main area
    app.shell.add(running, 'main');
  }
};

/**
 * Export the plugin as default.
 */
export default plugin;
