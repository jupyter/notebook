// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IRouter,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * A plugin to terminals in a new tab
 */
const opener: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-classic/terminal-extension:opener',
  requires: [IRouter],
  autoStart: true,
  activate: (app: JupyterFrontEnd, router: IRouter) => {
    const { commands } = app;
    const terminalPattern = new RegExp('/terminals/(.*)');

    const command = 'router:terminal';
    commands.addCommand(command, {
      execute: (args: any) => {
        const parsed = args as IRouter.ILocation;
        const matches = parsed.path.match(terminalPattern);
        if (!matches) {
          return;
        }
        const [, name] = matches;
        if (!name) {
          return;
        }

        commands.execute('terminal:open', { name });
      }
    });

    router.register({ command, pattern: terminalPattern });
  }
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [opener];

export default plugins;
