// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import {
  DOMUtils,
  ICommandPalette,
  ISessionContext,
  IToolbarWidgetRegistry,
} from '@jupyterlab/apputils';

import { Cell, CodeCell } from '@jupyterlab/cells';

import { PageConfig, Text, Time, URLExt } from '@jupyterlab/coreutils';

import { ReadonlyJSONObject } from '@lumino/coreutils';

import { IDocumentManager } from '@jupyterlab/docmanager';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import {
  IInspector,
  InspectionHandler,
  KernelConnector,
} from '@jupyterlab/inspector';

/**
 * Interface for inspection handler with custom mime bundle handling
 */
interface ICustomInspectionHandler extends InspectionHandler {
  onMimeBundleChange(mimeData: ReadonlyJSONObject): void;
}

import { IMainMenu } from '@jupyterlab/mainmenu';

import {
  INotebookTools,
  INotebookTracker,
  NotebookPanel,
} from '@jupyterlab/notebook';

import { Kernel, KernelMessage } from '@jupyterlab/services';

import { MimeModel } from '@jupyterlab/rendermime';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { ITranslator, nullTranslator } from '@jupyterlab/translation';

import { INotebookShell } from '@jupyter-notebook/application';

import { Poll } from '@lumino/polling';

import { Signal } from '@lumino/signaling';

import { Widget } from '@lumino/widgets';

import { TrustedComponent } from './trusted';

/**
 * The class for kernel status errors.
 */
const KERNEL_STATUS_ERROR_CLASS = 'jp-NotebookKernelStatus-error';

/**
 * The class for kernel status warnings.
 */
const KERNEL_STATUS_WARN_CLASS = 'jp-NotebookKernelStatus-warn';

/**
 * The class for kernel status infos.
 */
const KERNEL_STATUS_INFO_CLASS = 'jp-NotebookKernelStatus-info';

/**
 * The class to fade out the kernel status.
 */
const KERNEL_STATUS_FADE_OUT_CLASS = 'jp-NotebookKernelStatus-fade';

/**
 * The class for scrolled outputs
 */
const SCROLLED_OUTPUTS_CLASS = 'jp-mod-outputsScrolled';

/**
 * The class for the full width notebook
 */
const FULL_WIDTH_NOTEBOOK_CLASS = 'jp-mod-fullwidth';

/**
 * The command IDs used by the notebook plugins.
 */
namespace CommandIDs {
  /**
   * A command to open right sidebar for Editing Notebook Metadata
   */
  export const openEditNotebookMetadata = 'notebook:edit-metadata';

  /**
   * A command to toggle full width of the notebook
   */
  export const toggleFullWidth = 'notebook:toggle-full-width';
}

/**
 * A plugin for the checkpoint indicator
 */
const checkpoints: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/notebook-extension:checkpoints',
  description: 'A plugin for the checkpoint indicator.',
  autoStart: true,
  requires: [IDocumentManager, ITranslator],
  optional: [INotebookShell, IToolbarWidgetRegistry, ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
    docManager: IDocumentManager,
    translator: ITranslator,
    notebookShell: INotebookShell | null,
    toolbarRegistry: IToolbarWidgetRegistry | null,
    settingRegistry: ISettingRegistry | null
  ) => {
    const { shell } = app;
    const trans = translator.load('notebook');
    const node = document.createElement('div');

    if (toolbarRegistry) {
      toolbarRegistry.addFactory('TopBar', 'checkpoint', (toolbar) => {
        const widget = new Widget({ node });
        widget.id = DOMUtils.createDomID();
        widget.addClass('jp-NotebookCheckpoint');
        return widget;
      });
    }

    const getCurrent = () => {
      const current = shell.currentWidget;
      if (!current) {
        return null;
      }
      const context = docManager.contextForWidget(current);
      if (!context) {
        return null;
      }
      return context;
    };

    const updateCheckpointDisplay = async () => {
      const current = getCurrent();
      if (!current) {
        return;
      }
      const checkpoints = await current.listCheckpoints();
      if (!checkpoints || !checkpoints.length) {
        node.textContent = '';
        return;
      }
      const checkpoint = checkpoints[checkpoints.length - 1];
      node.textContent = trans.__(
        'Last Checkpoint: %1',
        Time.formatHuman(new Date(checkpoint.last_modified))
      );
    };

    const onSaveState = async (
      sender: DocumentRegistry.IContext<DocumentRegistry.IModel>,
      state: DocumentRegistry.SaveState
    ) => {
      if (state !== 'completed') {
        return;
      }
      // Add a small artificial delay so that the UI can pick up the newly created checkpoint.
      // Since the save state signal is emitted after a file save, but not after a checkpoint has been created.
      setTimeout(() => {
        void updateCheckpointDisplay();
      }, 500);
    };

    const onChange = async () => {
      const context = getCurrent();
      if (!context) {
        return;
      }

      context.saveState.disconnect(onSaveState);
      context.saveState.connect(onSaveState);

      await updateCheckpointDisplay();
    };

    if (notebookShell) {
      notebookShell.currentChanged.connect(onChange);
    }

    let checkpointPollingInterval = 30; // Default 30 seconds
    let poll: Poll | null = null;

    const createPoll = () => {
      if (poll) {
        poll.dispose();
      }
      if (checkpointPollingInterval > 0) {
        poll = new Poll({
          auto: true,
          factory: () => updateCheckpointDisplay(),
          frequency: {
            interval: checkpointPollingInterval * 1000,
            backoff: false,
          },
          standby: 'when-hidden',
        });
      }
    };

    const updateSettings = (settings: ISettingRegistry.ISettings): void => {
      checkpointPollingInterval = settings.get('checkpointPollingInterval')
        .composite as number;
      createPoll();
    };

    if (settingRegistry) {
      const loadSettings = settingRegistry.load(checkpoints.id);
      Promise.all([loadSettings, app.restored])
        .then(([settings]) => {
          updateSettings(settings);
          settings.changed.connect(updateSettings);
        })
        .catch((reason: Error) => {
          console.error(
            `Failed to load settings for ${checkpoints.id}: ${reason.message}`
          );
          // Fall back to creating poll with default settings
          createPoll();
        });
    } else {
      // Create poll with default settings
      createPoll();
    }
  },
};

/**
 * Add a command to close the browser tab when clicking on "Close and Shut Down"
 */
const closeTab: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/notebook-extension:close-tab',
  description:
    'Add a command to close the browser tab when clicking on "Close and Shut Down".',
  autoStart: true,
  requires: [IMainMenu],
  optional: [ITranslator],
  activate: (
    app: JupyterFrontEnd,
    menu: IMainMenu,
    translator: ITranslator | null
  ) => {
    const { commands } = app;
    translator = translator ?? nullTranslator;
    const trans = translator.load('notebook');

    const id = 'notebook:close-and-halt';
    commands.addCommand(id, {
      label: trans.__('Close and Shut Down Notebook'),
      execute: async () => {
        // Shut the kernel down, without confirmation
        await commands.execute('notebook:shutdown-kernel', { activate: false });
        window.close();
      },
    });
    menu.fileMenu.closeAndCleaners.add({
      id,
      // use a small rank to it takes precedence over the default
      // shut down action for the notebook
      rank: 0,
    });
  },
};

/**
 * Add a command to open the tree view from the notebook view
 */
const openTreeTab: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/notebook-extension:open-tree-tab',
  description:
    'Add a command to open a browser tab on the tree view when clicking "Open...".',
  autoStart: true,
  optional: [ITranslator],
  activate: (app: JupyterFrontEnd, translator: ITranslator | null) => {
    const { commands } = app;
    translator = translator ?? nullTranslator;
    const trans = translator.load('notebook');

    const id = 'notebook:open-tree-tab';
    commands.addCommand(id, {
      label: trans.__('Open…'),
      execute: async () => {
        const url = URLExt.join(PageConfig.getBaseUrl(), 'tree');
        window.open(url);
      },
    });
  },
};

/**
 * A plugin to set the notebook to full width.
 */
const fullWidthNotebook: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/notebook-extension:full-width-notebook',
  description: 'A plugin to set the notebook to full width.',
  autoStart: true,
  requires: [INotebookTracker],
  optional: [ICommandPalette, ISettingRegistry, ITranslator],
  activate: (
    app: JupyterFrontEnd,
    tracker: INotebookTracker,
    palette: ICommandPalette | null,
    settingRegistry: ISettingRegistry | null,
    translator: ITranslator | null
  ) => {
    const trans = (translator ?? nullTranslator).load('notebook');

    let fullWidth = false;

    const toggleFullWidth = () => {
      const current = tracker.currentWidget;
      fullWidth = !fullWidth;
      if (!current) {
        return;
      }
      const content = current;
      content.toggleClass(FULL_WIDTH_NOTEBOOK_CLASS, fullWidth);
    };

    let notebookSettings: ISettingRegistry.ISettings;

    if (settingRegistry) {
      const loadSettings = settingRegistry.load(fullWidthNotebook.id);

      const updateSettings = (settings: ISettingRegistry.ISettings): void => {
        const newFullWidth = settings.get('fullWidthNotebook')
          .composite as boolean;
        if (newFullWidth !== fullWidth) {
          toggleFullWidth();
        }
      };

      Promise.all([loadSettings, app.restored])
        .then(([settings]) => {
          notebookSettings = settings;
          updateSettings(settings);
          settings.changed.connect((settings) => {
            updateSettings(settings);
          });
        })
        .catch((reason: Error) => {
          console.error(reason.message);
        });
    }

    app.commands.addCommand(CommandIDs.toggleFullWidth, {
      label: trans.__('Enable Full Width Notebook'),
      execute: () => {
        toggleFullWidth();
        if (notebookSettings) {
          notebookSettings.set('fullWidthNotebook', fullWidth);
        }
      },
      isEnabled: () => tracker.currentWidget !== null,
      isToggled: () => fullWidth,
    });

    if (palette) {
      palette.addItem({
        command: CommandIDs.toggleFullWidth,
        category: 'Notebook Operations',
      });
    }
  },
};

/**
 * The kernel logo plugin.
 */
const kernelLogo: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/notebook-extension:kernel-logo',
  description: 'The kernel logo plugin.',
  autoStart: true,
  requires: [INotebookShell],
  optional: [IToolbarWidgetRegistry],
  activate: (
    app: JupyterFrontEnd,
    shell: INotebookShell,
    toolbarRegistry: IToolbarWidgetRegistry | null
  ) => {
    const { serviceManager } = app;

    const node = document.createElement('div');
    const img = document.createElement('img');

    const onChange = async () => {
      const current = shell.currentWidget;
      if (!(current instanceof NotebookPanel)) {
        return;
      }

      if (!node.hasChildNodes()) {
        node.appendChild(img);
      }

      await current.sessionContext.ready;
      current.sessionContext.kernelChanged.disconnect(onChange);
      current.sessionContext.kernelChanged.connect(onChange);

      const name = current.sessionContext.session?.kernel?.name ?? '';
      const spec = serviceManager.kernelspecs?.specs?.kernelspecs[name];
      if (!spec) {
        node.childNodes[0].remove();
        return;
      }

      const kernelIconUrl = spec.resources['logo-64x64'];
      if (!kernelIconUrl) {
        node.childNodes[0].remove();
        return;
      }

      img.src = kernelIconUrl;
      img.title = spec.display_name;
    };

    if (toolbarRegistry) {
      toolbarRegistry.addFactory('TopBar', 'kernelLogo', (toolbar) => {
        const widget = new Widget({ node });
        widget.addClass('jp-NotebookKernelLogo');
        return widget;
      });
    }

    app.started.then(() => {
      shell.currentChanged.connect(onChange);
    });
  },
};

/**
 * A plugin to display the kernel status;
 */
const kernelStatus: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/notebook-extension:kernel-status',
  description: 'A plugin to display the kernel status.',
  autoStart: true,
  requires: [INotebookShell, ITranslator],
  activate: (
    app: JupyterFrontEnd,
    shell: INotebookShell,
    translator: ITranslator
  ) => {
    const trans = translator.load('notebook');
    const widget = new Widget();
    widget.addClass('jp-NotebookKernelStatus');
    app.shell.add(widget, 'menu', { rank: 10_010 });

    const removeClasses = () => {
      widget.removeClass(KERNEL_STATUS_ERROR_CLASS);
      widget.removeClass(KERNEL_STATUS_WARN_CLASS);
      widget.removeClass(KERNEL_STATUS_INFO_CLASS);
      widget.removeClass(KERNEL_STATUS_FADE_OUT_CLASS);
    };

    const onStatusChanged = (sessionContext: ISessionContext) => {
      const status = sessionContext.kernelDisplayStatus;
      let text = `Kernel ${Text.titleCase(status)}`;
      removeClasses();
      switch (status) {
        case 'busy':
        case 'idle':
          text = '';
          widget.addClass(KERNEL_STATUS_FADE_OUT_CLASS);
          break;
        case 'dead':
        case 'terminating':
          widget.addClass(KERNEL_STATUS_ERROR_CLASS);
          break;
        case 'unknown':
          widget.addClass(KERNEL_STATUS_WARN_CLASS);
          break;
        default:
          widget.addClass(KERNEL_STATUS_INFO_CLASS);
          widget.addClass(KERNEL_STATUS_FADE_OUT_CLASS);
          break;
      }
      widget.node.textContent = trans.__(text);
    };

    const onChange = async () => {
      const current = shell.currentWidget;
      if (!(current instanceof NotebookPanel)) {
        return;
      }
      const sessionContext = current.sessionContext;
      sessionContext.statusChanged.connect(onStatusChanged);
    };

    shell.currentChanged.connect(onChange);
  },
};

/**
 * A plugin to enable scrolling for outputs by default.
 * Mimic the logic from the classic notebook, as found here:
 * https://github.com/jupyter/notebook/blob/a9a31c096eeffe1bff4e9164c6a0442e0e13cdb3/notebook/static/notebook/js/outputarea.js#L96-L120
 */
const scrollOutput: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/notebook-extension:scroll-output',
  description: 'A plugin to enable scrolling for outputs by default.',
  autoStart: true,
  requires: [INotebookTracker],
  optional: [ISettingRegistry],
  activate: async (
    app: JupyterFrontEnd,
    tracker: INotebookTracker,
    settingRegistry: ISettingRegistry | null
  ) => {
    const autoScrollThreshold = 100;
    let autoScrollOutputs = true;

    // decide whether to scroll the output of the cell based on some heuristics
    const autoScroll = (cell: CodeCell) => {
      if (!autoScrollOutputs) {
        // bail if disabled via the settings
        cell.removeClass(SCROLLED_OUTPUTS_CLASS);
        return;
      }
      const { outputArea } = cell;
      // respect cells with an explicit scrolled state
      const scrolled = cell.model.getMetadata('scrolled');
      if (scrolled !== undefined) {
        return;
      }
      const { node } = outputArea;
      const height = node.scrollHeight;
      const fontSize = parseFloat(node.style.fontSize.replace('px', ''));
      const lineHeight = (fontSize || 14) * 1.3;
      // do not set via cell.outputScrolled = true, as this would
      // otherwise synchronize the scrolled state to the notebook metadata
      const scroll = height > lineHeight * autoScrollThreshold;
      cell.toggleClass(SCROLLED_OUTPUTS_CLASS, scroll);
    };

    const handlers: { [id: string]: () => void } = {};

    const setAutoScroll = (cell: Cell) => {
      if (cell.model.type === 'code') {
        const codeCell = cell as CodeCell;
        const id = codeCell.model.id;
        autoScroll(codeCell);
        if (handlers[id]) {
          codeCell.outputArea.model.changed.disconnect(handlers[id]);
        }
        handlers[id] = () => autoScroll(codeCell);
        codeCell.outputArea.model.changed.connect(handlers[id]);
      }
    };

    tracker.widgetAdded.connect((sender, notebook) => {
      // when the notebook widget is created, process all the cells
      notebook.sessionContext.ready.then(() => {
        notebook.content.widgets.forEach(setAutoScroll);
      });

      notebook.model?.cells.changed.connect((sender, args) => {
        notebook.content.widgets.forEach(setAutoScroll);
      });
    });

    if (settingRegistry) {
      const loadSettings = settingRegistry.load(scrollOutput.id);
      const updateSettings = (settings: ISettingRegistry.ISettings): void => {
        autoScrollOutputs = settings.get('autoScrollOutputs')
          .composite as boolean;
      };

      Promise.all([loadSettings, app.restored])
        .then(([settings]) => {
          updateSettings(settings);
          settings.changed.connect((settings) => {
            updateSettings(settings);
          });
        })
        .catch((reason: Error) => {
          console.error(reason.message);
        });
    }
  },
};

/**
 * A plugin to add the NotebookTools to the side panel;
 */
const notebookToolsWidget: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/notebook-extension:notebook-tools',
  description: 'A plugin to add the NotebookTools to the side panel.',
  autoStart: true,
  requires: [INotebookShell],
  optional: [INotebookTools],
  activate: (
    app: JupyterFrontEnd,
    shell: INotebookShell,
    notebookTools: INotebookTools | null
  ) => {
    const onChange = async () => {
      const current = shell.currentWidget;
      if (!(current instanceof NotebookPanel)) {
        return;
      }

      // Add the notebook tools in right area.
      if (notebookTools) {
        shell.add(notebookTools, 'right', { type: 'Property Inspector' });
      }
    };
    shell.currentChanged.connect(onChange);
  },
};

/**
 * A plugin to update the tab icon based on the kernel status.
 */
const tabIcon: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/notebook-extension:tab-icon',
  description: 'A plugin to update the tab icon based on the kernel status.',
  autoStart: true,
  requires: [INotebookTracker],
  activate: (app: JupyterFrontEnd, tracker: INotebookTracker) => {
    // the favicons are provided by Jupyter Server
    const baseURL = PageConfig.getBaseUrl();
    const notebookIcon = URLExt.join(
      baseURL,
      'static/favicons/favicon-notebook.ico'
    );
    const busyIcon = URLExt.join(baseURL, 'static/favicons/favicon-busy-1.ico');

    const updateBrowserFavicon = (
      status: ISessionContext.KernelDisplayStatus
    ) => {
      const link = document.querySelector(
        "link[rel*='icon']"
      ) as HTMLLinkElement;
      switch (status) {
        case 'busy':
          link.href = busyIcon;
          break;
        case 'idle':
          link.href = notebookIcon;
          break;
      }
    };

    const onChange = async () => {
      const current = tracker.currentWidget;
      const sessionContext = current?.sessionContext;
      if (!sessionContext) {
        return;
      }

      sessionContext.statusChanged.connect(() => {
        const status = sessionContext.kernelDisplayStatus;
        updateBrowserFavicon(status);
      });
    };

    tracker.currentChanged.connect(onChange);
  },
};

/**
 * A plugin that adds a Trusted indicator to the menu area
 */
const trusted: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/notebook-extension:trusted',
  description: 'A plugin that adds a Trusted indicator to the menu area.',
  autoStart: true,
  requires: [INotebookShell, ITranslator],
  activate: (
    app: JupyterFrontEnd,
    notebookShell: INotebookShell,
    translator: ITranslator
  ): void => {
    const onChange = async () => {
      const current = notebookShell.currentWidget;
      if (!(current instanceof NotebookPanel)) {
        return;
      }

      const notebook = current.content;
      await current.context.ready;

      const widget = TrustedComponent.create({ notebook, translator });
      notebookShell.add(widget, 'menu', {
        rank: 11_000,
      });
    };

    notebookShell.currentChanged.connect(onChange);
  },
};

/**
 * Add a command to open right sidebar for Editing Notebook Metadata when clicking on "Edit Notebook Metadata" under Edit menu
 */
const editNotebookMetadata: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/notebook-extension:edit-notebook-metadata',
  description:
    'Add a command to open right sidebar for Editing Notebook Metadata when clicking on "Edit Notebook Metadata" under Edit menu',
  autoStart: true,
  optional: [ICommandPalette, ITranslator, INotebookTools],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette | null,
    translator: ITranslator | null,
    notebookTools: INotebookTools | null
  ) => {
    const { commands, shell } = app;
    translator = translator ?? nullTranslator;
    const trans = translator.load('notebook');

    commands.addCommand(CommandIDs.openEditNotebookMetadata, {
      label: trans.__('Edit Notebook Metadata'),
      execute: async () => {
        const command = 'application:toggle-panel';
        const args = {
          side: 'right',
          title: 'Show Notebook Tools',
          id: 'notebook-tools',
        };

        // Check if Show Notebook Tools (Right Sidebar) is open (expanded)
        if (!commands.isToggled(command, args)) {
          await commands.execute(command, args).then((_) => {
            // For expanding the 'Advanced Tools' section (default: collapsed)
            if (notebookTools) {
              const tools = (notebookTools?.layout as any).widgets;
              tools.forEach((tool: any) => {
                if (
                  tool.widget.title.label === trans.__('Advanced Tools') &&
                  tool.collapsed
                ) {
                  tool.toggle();
                }
              });
            }
          });
        }
      },
      isVisible: () =>
        shell.currentWidget !== null &&
        shell.currentWidget instanceof NotebookPanel,
    });

    if (palette) {
      palette.addItem({
        command: CommandIDs.openEditNotebookMetadata,
        category: 'Notebook Operations',
      });
    }
  },
};

/**
 * A plugin providing a pager widget to display help and documentation
 * in the down panel, similar to classic notebook behavior.
 */
const pager: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/notebook-extension:pager',
  description:
    'A plugin to toggle the inspector when a pager payload is received.',
  autoStart: true,
  requires: [INotebookTracker, IInspector],
  optional: [ISettingRegistry, ITranslator],
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    inspector: IInspector,
    settingRegistry: ISettingRegistry | null,
    translator: ITranslator | null
  ) => {
    translator = translator ?? nullTranslator;

    let openHelpInDownArea = true;

    const kernelMessageHandlers: {
      [sessionId: string]: {
        kernel: Kernel.IKernelConnection;
        handler: (
          sender: Kernel.IKernelConnection,
          args: Kernel.IAnyMessageArgs
        ) => void;
      };
    } = {};

    const cleanupKernelMessageHandler = (sessionId: string) => {
      if (kernelMessageHandlers[sessionId]) {
        const { kernel, handler } = kernelMessageHandlers[sessionId];
        kernel.anyMessage.disconnect(handler);
        delete kernelMessageHandlers[sessionId];
      }
    };

    if (settingRegistry) {
      const loadSettings = settingRegistry.load(pager.id);
      const updateSettings = (settings: ISettingRegistry.ISettings): void => {
        openHelpInDownArea = settings.get('openHelpInDownArea')
          .composite as boolean;
        setSource(app.shell.currentWidget);
      };

      Promise.all([loadSettings, app.restored])
        .then(([settings]) => {
          updateSettings(settings);
          settings.changed.connect(updateSettings);
        })
        .catch((reason: Error) => {
          console.error(
            `Failed to load settings for ${pager.id}: ${reason.message}`
          );
        });
    }

    const setupPagerListener = (sessionContext: ISessionContext) => {
      const sessionId = sessionContext.session?.id;
      if (!sessionId) {
        return;
      }

      // Always clean up existing handlers first
      cleanupKernelMessageHandler(sessionId);

      if (!openHelpInDownArea) {
        return;
      }

      // Listen for kernel messages that may contain pager payloads
      const kernelMessageHandler = async (
        sender: Kernel.IKernelConnection,
        args: Kernel.IAnyMessageArgs
      ) => {
        const { msg, direction } = args;

        // only check 'execute_reply' from the shell channel for pager data
        if (
          direction === 'recv' &&
          msg.channel === 'shell' &&
          msg.header.msg_type === 'execute_reply'
        ) {
          const content = msg.content as KernelMessage.IExecuteReply;
          if (
            content.status === 'ok' &&
            content.payload &&
            content.payload.length > 0
          ) {
            const pagePayload = content.payload.find(
              (item) => item.source === 'page'
            );

            if (pagePayload && pagePayload.data) {
              // Remove the 'page' payload from the message to prevent it from also appearing in the cell's output area
              content.payload = content.payload.filter(
                (item) => item.source !== 'page'
              );
              if (content.payload.length === 0) {
                // If no other payloads remain, delete the payload array from the content.
                delete content.payload;
              }

              await app.commands.execute('inspector:open');

              // Call our custom handler directly with the whole mime bundle
              inspectionHandler.onMimeBundleChange(
                pagePayload.data as ReadonlyJSONObject
              );
            }
          }
        }
      };

      // Connect to the kernel's anyMessage signal to catch
      // pager payloads before the output area
      if (sessionContext.session?.kernel) {
        sessionContext.session.kernel.anyMessage.connect(kernelMessageHandler);
        kernelMessageHandlers[sessionId] = {
          kernel: sessionContext.session.kernel,
          handler: kernelMessageHandler,
        };
      }
    };

    let inspectionHandler: ICustomInspectionHandler;

    // Create a handler for each notebook that is created.
    notebookTracker.widgetAdded.connect((_sender, panel) => {
      // Use custom pager behavior
      if (panel.sessionContext) {
        setupPagerListener(panel.sessionContext);
      }

      panel.sessionContext.sessionChanged.connect(() => {
        if (panel.sessionContext) {
          setupPagerListener(panel.sessionContext);
        }
      });

      panel.sessionContext.kernelChanged.connect(() => {
        if (panel.sessionContext) {
          setupPagerListener(panel.sessionContext);
        }
      });

      const sessionContext = panel.sessionContext;
      const rendermime = panel.content.rendermime;
      const connector = new (class extends KernelConnector {
        async fetch(request: InspectionHandler.IRequest): Promise<any> {
          // no-op
        }
      })({ sessionContext });

      // Define a custom inspection handler so we can persist the pager data even after
      // switching cells or moving the cursor position
      inspectionHandler = new (class extends InspectionHandler {
        get inspected() {
          return this._notebookInspected;
        }

        onEditorChange(text: string): void {
          // no-op
        }

        onMimeBundleChange(mimeData: ReadonlyJSONObject): void {
          const update: IInspector.IInspectorUpdate = { content: null };

          if (mimeData) {
            const mimeType = rendermime.preferredMimeType(mimeData);
            if (mimeType) {
              const widget = rendermime.createRenderer(mimeType);
              // set trusted since this is coming from a cell execution
              const trusted = true;
              const model = new MimeModel({ data: mimeData, trusted });
              void widget.renderModel(model);
              update.content = widget;
            }
          }

          // Emit the inspection update signal
          this._notebookInspected.emit(update);
        }

        private _notebookInspected: Signal<
          InspectionHandler,
          IInspector.IInspectorUpdate
        > = new Signal<InspectionHandler, IInspector.IInspectorUpdate>(this);
      })({ connector, rendermime });

      // Listen for parent disposal.
      panel.disposed.connect(() => {
        inspectionHandler.dispose();
      });
    });

    // Keep track of notebook instances and set inspector source.
    const setSource = (widget: Widget | null): void => {
      if (openHelpInDownArea) {
        inspector.source = inspectionHandler;
      } else {
        if (widget && notebookTracker.currentWidget) {
          // default to the JupyterLab behavior but with a single inspection handler,
          // since there is only one active notebook at a time
          const panel = notebookTracker.currentWidget;
          const sessionContext = panel.sessionContext;
          const rendermime = panel.content.rendermime;
          const connector = new KernelConnector({ sessionContext });
          const handler = new InspectionHandler({
            connector,
            rendermime,
          });

          const cell = panel.content.activeCell;
          handler.editor = cell && cell.editor;

          panel.content.activeCellChanged.connect((sender, cell) => {
            void cell?.ready.then(() => {
              if (cell === panel.content.activeCell && cell) {
                handler.editor = cell.editor;
              }
            });
          });

          panel.disposed.connect(() => {
            handler.dispose();
          });
          inspector.source = handler;
        }
      }
    };
    app.shell.currentChanged?.connect((_, args) => setSource(args.newValue));
    void app.restored.then(() => setSource(app.shell.currentWidget));
  },
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [
  checkpoints,
  closeTab,
  openTreeTab,
  editNotebookMetadata,
  fullWidthNotebook,
  kernelLogo,
  kernelStatus,
  notebookToolsWidget,
  pager,
  scrollOutput,
  tabIcon,
  trusted,
];

export default plugins;
