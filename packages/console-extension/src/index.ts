// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IRouter,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { ICommandPalette } from '@jupyterlab/apputils';

import { IEditorServices } from '@jupyterlab/codeeditor';

import {
  ConsolePanel,
  IConsoleCellExecutor,
  IConsoleTracker,
} from '@jupyterlab/console';

import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import { INotebookTracker } from '@jupyterlab/notebook';

import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

import { ITranslator, nullTranslator } from '@jupyterlab/translation';

import { consoleIcon } from '@jupyterlab/ui-components';

import {
  INotebookPathOpener,
  INotebookShell,
  defaultNotebookPathOpener,
} from '@jupyter-notebook/application';

import { find } from '@lumino/algorithm';

import { Widget } from '@lumino/widgets';

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
 * Open consoles in a new tab.
 */
const redirect: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/console-extension:redirect',
  requires: [IConsoleTracker],
  optional: [INotebookPathOpener],
  autoStart: true,
  description: 'Open consoles in a new tab',
  activate: (
    app: JupyterFrontEnd,
    tracker: IConsoleTracker,
    notebookPathOpener: INotebookPathOpener | null
  ) => {
    const baseUrl = PageConfig.getBaseUrl();
    const opener = notebookPathOpener ?? defaultNotebookPathOpener;

    tracker.widgetAdded.connect(async (send, console) => {
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
  requires: [
    ConsolePanel.IContentFactory,
    IConsoleCellExecutor,
    IEditorServices,
    IRenderMimeRegistry,
    INotebookTracker,
  ],
  optional: [INotebookShell, ICommandPalette, ITranslator],
  autoStart: true,
  description: 'Open consoles in a new tab',
  activate: (
    app: JupyterFrontEnd,
    contentFactory: ConsolePanel.IContentFactory,
    executor: IConsoleCellExecutor,
    editorServices: IEditorServices,
    rendermime: IRenderMimeRegistry,
    tracker: INotebookTracker,
    notebookShell: INotebookShell | null,
    palette: ICommandPalette | null,
    translator: ITranslator | null
  ) => {
    const { commands } = app;
    const manager = app.serviceManager;

    const trans = (translator ?? nullTranslator).load('notebook');

    const command = 'console:scratch-pad';
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

        let panel: Widget | undefined = notebookShell.rightHandler.widgets.find(
          (w) => w.id === scratchPadConsole.id
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
          panel = new ConsolePanel({
            manager,
            contentFactory,
            mimeTypeService: editorServices.mimeTypeService,
            rendermime,
            executor,
            kernelPreference: { ...kernelPref, id },
          });
          panel.title.caption = trans.__('Console');
          panel.id = scratchPadConsole.id;

          app.shell.add(panel, 'right');
        }

        notebookShell.expandRight(scratchPadConsole.id);
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
