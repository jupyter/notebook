// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IRouter,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IConsoleTracker } from '@jupyterlab/console';

import { PageConfig } from '@jupyterlab/coreutils';

import { find } from '@lumino/algorithm';

/**
 * A plugin to open consoles in a new tab
 */
const opener: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/console-extension:opener',
  requires: [IRouter],
  autoStart: true,
  activate: (app: JupyterFrontEnd, router: IRouter) => {
    const { commands } = app;
    const consolePattern = new RegExp('/consoles/(.*)');

    const command = 'router:console';
    commands.addCommand(command, {
      execute: (args: any) => {
        const parsed = args as IRouter.ILocation;
        const matches = parsed.path.match(consolePattern);
        if (!matches) {
          return;
        }
        const [, name] = matches;
        if (!name) {
          return;
        }

        commands.execute('console:create', { name });
      }
    });

    router.register({ command, pattern: consolePattern });
  }
};

/**
 * Open consoles in a new tab.
 */
const redirect: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/console-extension:redirect',
  requires: [IConsoleTracker],
  autoStart: true,
  activate: (app: JupyterFrontEnd, tracker: IConsoleTracker) => {
    const baseUrl = PageConfig.getBaseUrl();
    tracker.widgetAdded.connect((send, console) => {
      const widget = find(app.shell.widgets('main'), w => w.id === console.id);
      if (widget) {
        // bail if the console is already added to the main area
        return;
      }
      const name = console.sessionContext.name;
      window.open(`${baseUrl}retro/consoles/${name}`, '_blank');
    });
  }
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [opener, redirect];

export default plugins;
