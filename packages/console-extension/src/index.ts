// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IRouter,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { ICommandPalette } from '@jupyterlab/apputils';

import { IConsoleTracker } from '@jupyterlab/console';

import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import { INotebookTracker } from '@jupyterlab/notebook';

import { ITranslator, nullTranslator } from '@jupyterlab/translation';

import { consoleIcon } from '@jupyterlab/ui-components';

import {
  INotebookPathOpener,
  INotebookShell,
  defaultNotebookPathOpener,
} from '@jupyter-notebook/application';

import { find } from '@lumino/algorithm';

import { ReadonlyJSONObject } from '@lumino/coreutils';

import { Widget } from '@lumino/widgets';

const COMMANDS_TO_PATCH = [
  'console:clear',
  'console:run-unforced',
  'console:run-forced',
  'console:linebreak',
  'console:interrupt-kernel',
  'console:restart-kernel',
  'console:change-kernel',
];

/**
 * A plugin to open consoles in a new tab
 */
const opener: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/console-extension:opener',
  requires: [IRouter],
  autoStart: true,
  description: 'A plugin to open consoles in a new tab',
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
        const [, match] = matches;
        if (!match) {
          return;
        }

        const path = decodeURIComponent(match);
        commands.execute('console:create', { path });
      },
    });

    router.register({ command, pattern: consolePattern });
  },
};

/**
 * Open consoles in a new tab or in the side panel (scratch-pad like).
 */
const redirect: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/console-extension:redirect',
  requires: [IConsoleTracker],
  optional: [INotebookPathOpener, INotebookShell, INotebookTracker],
  autoStart: true,
  description: 'Open consoles in a new tab',
  activate: (
    app: JupyterFrontEnd,
    tracker: IConsoleTracker,
    notebookPathOpener: INotebookPathOpener | null,
    notebookShell: INotebookShell | null,
    notebookTracker: INotebookTracker | null
  ) => {
    const baseUrl = PageConfig.getBaseUrl();
    const opener = notebookPathOpener ?? defaultNotebookPathOpener;

    tracker.widgetAdded.connect(async (send, console) => {
      // Check if we should open the console in side panel:
      //  - this is a notebook view
      //  - the notebook and the console share the same kernel
      // Otherwise, the console opens in a new tab.
      if (notebookShell && notebookTracker) {
        const notebook = notebookTracker.currentWidget;

        // Wait for the notebook and console to be ready.
        await Promise.all([
          notebook?.sessionContext.ready,
          console.sessionContext.ready,
        ]);
        const notebookKernelId = notebook?.sessionContext.session?.kernel?.id;
        const consoleKernelId = console.sessionContext.session?.kernel?.id;

        if (notebookKernelId === consoleKernelId) {
          notebookShell.add(console, 'right');
          notebookShell.expandRight(console.id);

          // Some commands needs to be patched to be enabled.
          // TODO: fix it upstream in jupyterlab.
          app.commands
            .listCommands()
            .filter((id) => COMMANDS_TO_PATCH.includes(id))
            .forEach((id) => {
              (app.commands as any)._commands.get(id).isEnabled = () =>
                tracker.currentWidget !== null &&
                tracker.currentWidget.node.contains(document.activeElement);
            });
          return;
        }
      }

      const { sessionContext } = console;
      await sessionContext.ready;
      const widget = find(
        app.shell.widgets('main'),
        (w) => w.id === console.id
      );
      if (widget) {
        // bail if the console is already added to the main area
        return;
      }
      opener.open({
        prefix: URLExt.join(baseUrl, 'consoles'),
        path: sessionContext.path,
        target: '_blank',
      });

      // the widget is not needed anymore
      console.dispose();
    });
  },
};

/**
 * Open consoles in the side panel.
 */
const scratchPadConsole: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/console-extension:scratch-pad',
  requires: [INotebookTracker],
  optional: [INotebookShell, ICommandPalette, ITranslator],
  autoStart: true,
  description: 'Open consoles in a new tab',
  activate: (
    app: JupyterFrontEnd,
    tracker: INotebookTracker,
    notebookShell: INotebookShell | null,
    palette: ICommandPalette | null,
    translator: ITranslator | null
  ) => {
    const { commands } = app;
    const manager = app.serviceManager;

    const trans = (translator ?? nullTranslator).load('notebook');

    const command = 'scratch-pad-console:open';
    commands.addCommand(command, {
      label: (args) =>
        args['isPalette']
          ? trans.__('Open a scratch-pad console')
          : trans.__('Scratch-pad console'),
      isVisible: () => !!tracker.currentWidget,
      icon: (args) => (args['isPalette'] ? undefined : consoleIcon),
      execute: async () => {
        if (!notebookShell) {
          return;
        }
        const consoleId = scratchPadConsole.id;
        const sidebar = notebookShell.rightHandler;

        // Close the console if it is already opened.
        if (sidebar.isVisible && sidebar.currentWidget?.id === consoleId) {
          notebookShell.collapseRight();
          notebookShell.currentWidget?.activate();
          return;
        }

        let panel: Widget | undefined = sidebar.widgets.find(
          (w) => w.id === consoleId
        );

        // Create the widget if it is not already in the right area.
        if (!panel) {
          const notebook = tracker.currentWidget;
          if (!notebook) {
            return;
          }
          const notebookSessionContext = notebook.sessionContext;

          await Promise.all([notebookSessionContext.ready, manager.ready]);

          const id = notebookSessionContext.session?.kernel?.id;
          const kernelPref = notebookSessionContext.kernelPreference;

          panel = await commands.execute('console:create', {
            kernelPreference: { ...kernelPref, id } as ReadonlyJSONObject,
          });

          if (!panel) {
            console.log('An error occurred during console widget creation');
            return;
          }

          panel.title.caption = trans.__('Console');
          panel.id = consoleId;
        } else {
          notebookShell.expandRight(consoleId);
        }
      },
      describedBy: {
        args: {
          type: 'object',
          properties: {
            isPalette: {
              type: 'boolean',
              description: trans.__(
                trans.__('Whether the command is executed from the palette')
              ),
            },
          },
        },
      },
    });

    if (palette) {
      palette.addItem({
        category: 'Notebook Console',
        command,
        args: { isPalette: true },
      });
    }
  },
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [
  opener,
  redirect,
  scratchPadConsole,
];

export default plugins;
