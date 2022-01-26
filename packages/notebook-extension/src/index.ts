// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISessionContext, DOMUtils } from '@jupyterlab/apputils';

import { CodeCell } from '@jupyterlab/cells';

import { Text, Time } from '@jupyterlab/coreutils';

import { IDocumentManager } from '@jupyterlab/docmanager';

import { NotebookPanel, INotebookTracker } from '@jupyterlab/notebook';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { ITranslator } from '@jupyterlab/translation';

import { IRetroShell } from '@retrolab/application';

import { Poll } from '@lumino/polling';

import { Widget } from '@lumino/widgets';

/**
 * The class for kernel status errors.
 */
const KERNEL_STATUS_ERROR_CLASS = 'jp-RetroKernelStatus-error';

/**
 * The class for kernel status warnings.
 */
const KERNEL_STATUS_WARN_CLASS = 'jp-RetroKernelStatus-warn';

/**
 * The class for kernel status infos.
 */
const KERNEL_STATUS_INFO_CLASS = 'jp-RetroKernelStatus-info';

/**
 * The class to fade out the kernel status.
 */
const KERNEL_STATUS_FADE_OUT_CLASS = 'jp-RetroKernelStatus-fade';

/**
 * The class for scrolled outputs
 */
const SCROLLED_OUTPUTS_CLASS = 'jp-mod-outputsScrolled';

/**
 * A plugin for the checkpoint indicator
 */
const checkpoints: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/notebook-extension:checkpoints',
  autoStart: true,
  requires: [IDocumentManager, ITranslator],
  optional: [IRetroShell],
  activate: (
    app: JupyterFrontEnd,
    docManager: IDocumentManager,
    translator: ITranslator,
    retroShell: IRetroShell | null
  ) => {
    const { shell } = app;
    const trans = translator.load('retrolab');
    const widget = new Widget();
    widget.id = DOMUtils.createDomID();
    widget.addClass('jp-RetroCheckpoint');
    app.shell.add(widget, 'top', { rank: 100 });

    const onChange = async () => {
      const current = shell.currentWidget;
      if (!current) {
        return;
      }
      const context = docManager.contextForWidget(current);

      context?.fileChanged.disconnect(onChange);
      context?.fileChanged.connect(onChange);

      const checkpoints = await context?.listCheckpoints();
      if (!checkpoints) {
        return;
      }
      const checkpoint = checkpoints[checkpoints.length - 1];
      widget.node.textContent = trans.__(
        'Last Checkpoint: %1',
        Time.formatHuman(new Date(checkpoint.last_modified))
      );
    };

    if (retroShell) {
      retroShell.currentChanged.connect(onChange);
    }

    new Poll({
      auto: true,
      factory: () => onChange(),
      frequency: {
        interval: 2000,
        backoff: false
      },
      standby: 'when-hidden'
    });
  }
};

/**
 * The kernel logo plugin.
 */
const kernelLogo: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/notebook-extension:kernel-logo',
  autoStart: true,
  requires: [IRetroShell],
  activate: (app: JupyterFrontEnd, shell: IRetroShell) => {
    const { serviceManager } = app;

    let widget: Widget;
    const onChange = async () => {
      if (widget) {
        widget.dispose();
        widget.parent = null;
      }
      const current = shell.currentWidget;
      if (!(current instanceof NotebookPanel)) {
        return;
      }

      await current.sessionContext.ready;
      current.sessionContext.kernelChanged.disconnect(onChange);
      current.sessionContext.kernelChanged.connect(onChange);

      const name = current.sessionContext.session?.kernel?.name ?? '';
      const spec = serviceManager.kernelspecs?.specs?.kernelspecs[name];
      if (!spec) {
        return;
      }

      const kernelIconUrl = spec.resources['logo-64x64'];
      if (!kernelIconUrl) {
        return;
      }

      const node = document.createElement('div');
      const img = document.createElement('img');
      img.src = kernelIconUrl;
      img.title = spec.display_name;
      node.appendChild(img);
      widget = new Widget({ node });
      widget.addClass('jp-RetroKernelLogo');
      app.shell.add(widget, 'top', { rank: 10_010 });
    };

    app.started.then(() => {
      shell.currentChanged.connect(onChange);
    });
  }
};

/**
 * A plugin to display the kernel status;
 */
const kernelStatus: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/notebook-extension:kernel-status',
  autoStart: true,
  requires: [IRetroShell, ITranslator],
  activate: (
    app: JupyterFrontEnd,
    shell: IRetroShell,
    translator: ITranslator
  ) => {
    const trans = translator.load('retrolab');
    const widget = new Widget();
    widget.addClass('jp-RetroKernelStatus');
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
  }
};

/**
 * A plugin to add an extra shortcut to execute a cell in place via Cmd-Enter on Mac.
 * TODO: switch to settings define menus when fixed upstream: https://github.com/jupyterlab/jupyterlab/issues/11754
 */
const runShortcut: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/notebook-extension:run-shortcut',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    app.commands.addKeyBinding({
      command: 'notebook:run-cell',
      keys: ['Accel Enter'],
      selector: '.jp-Notebook:focus'
    });

    app.commands.addKeyBinding({
      command: 'notebook:run-cell',
      keys: ['Accel Enter'],
      selector: '.jp-Notebook.jp-mod-editMode'
    });
  }
};

/**
 * A plugin to enable scrolling for outputs by default.
 * Mimic the logic from the classic notebook, as found here:
 * https://github.com/jupyter/notebook/blob/a9a31c096eeffe1bff4e9164c6a0442e0e13cdb3/notebook/static/notebook/js/outputarea.js#L96-L120
 */
const scrollOutput: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/notebook-extension:scroll-output',
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
        return;
      }
      const { outputArea } = cell;
      // respect cells with an explicit scrolled state
      const scrolled = cell.model.metadata.get('scrolled');
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

    tracker.widgetAdded.connect((sender, notebook) => {
      notebook.model?.cells.changed.connect((sender, changed) => {
        // process new cells only
        if (!(changed.type === 'add')) {
          return;
        }
        const [cellModel] = changed.newValues;
        notebook.content.widgets.forEach(cell => {
          if (cell.model.id === cellModel.id && cell.model.type === 'code') {
            const codeCell = cell as CodeCell;
            codeCell.outputArea.model.changed.connect(() =>
              autoScroll(codeCell)
            );
          }
        });
      });

      // when the notebook widget is created, process all the cells
      // TODO: investigate why notebook.content.fullyRendered is not enough
      notebook.sessionContext.ready.then(() => {
        notebook.content.widgets.forEach(cell => {
          if (cell.model.type === 'code') {
            autoScroll(cell as CodeCell);
          }
        });
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
          settings.changed.connect(settings => {
            updateSettings(settings);
          });
        })
        .catch((reason: Error) => {
          console.error(reason.message);
        });
    }
  }
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [
  checkpoints,
  kernelLogo,
  kernelStatus,
  runShortcut,
  scrollOutput
];

export default plugins;
