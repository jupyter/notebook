// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IRouter,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  Router
} from '@jupyterlab/application';

import {
  sessionContextDialogs,
  ISessionContextDialogs,
  ISessionContext,
  DOMUtils
} from '@jupyterlab/apputils';

import { PageConfig, Text, Time } from '@jupyterlab/coreutils';

import { IDocumentManager, renameDialog } from '@jupyterlab/docmanager';

import { IMainMenu } from '@jupyterlab/mainmenu';

import { NotebookPanel } from '@jupyterlab/notebook';

import { ITranslator, TranslationManager } from '@jupyterlab/translation';

import {
  App,
  ClassicShell,
  IClassicShell
} from '@jupyterlab-classic/application';

import { jupyterIcon } from '@jupyterlab-classic/ui-components';

import { Widget } from '@lumino/widgets';

/**
 * The default notebook factory.
 */
const NOTEBOOK_FACTORY = 'Notebook';

/**
 * The class for kernel status errors.
 */
const KERNEL_STATUS_ERROR_CLASS = 'jp-ClassicKernelStatus-error';

/**
 * The class for kernel status warnings.
 */
const KERNEL_STATUS_WARN_CLASS = 'jp-ClassicKernelStatus-warn';

/**
 * The class for kernel status infos.
 */
const KERNEL_STATUS_INFO_CLASS = 'jp-ClassicKernelStatus-info';

/**
 * The class to fade out the kernel status.
 */
const KERNEL_STATUS_FADE_OUT_CLASS = 'jp-ClassicKernelStatus-fade';

/**
 * The command IDs used by the application plugin.
 */
namespace CommandIDs {
  /**
   * Toggle Top Bar visibility
   */
  export const toggleTop = 'application:toggle-top';
}

/**
 * A plugin for the checkpoint indicator
 */
const checkpoints: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-classic/application-extension:checkpoints',
  autoStart: true,
  requires: [IDocumentManager],
  optional: [IClassicShell],
  activate: (
    app: JupyterFrontEnd,
    docManager: IDocumentManager,
    classicShell: IClassicShell
  ) => {
    const { shell } = app;
    const widget = new Widget();
    widget.id = DOMUtils.createDomID();
    widget.addClass('jp-ClassicCheckpoint');
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
      widget.node.textContent = `Last Checkpoint: ${Time.formatHuman(
        new Date(checkpoint.last_modified)
      )}`;
    };

    if (classicShell) {
      classicShell.currentChanged.connect(onChange);
    }
    // TODO: replace by a Poll
    onChange();
    setInterval(onChange, 2000);
  }
};

/**
 * The kernel logo plugin.
 */
const kernelLogo: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-classic/application-extension:kernel-logo',
  autoStart: true,
  requires: [IClassicShell],
  activate: (app: JupyterFrontEnd, shell: IClassicShell) => {
    const { serviceManager } = app;
    const baseUrl = PageConfig.getBaseUrl();

    let widget: Widget;
    // TODO: this signal might not be needed if we assume there is always only
    // one notebook in the main area
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

      let kernelIconUrl = spec.resources['logo-64x64'];
      if (!kernelIconUrl) {
        return;
      }

      const index = kernelIconUrl.indexOf('kernelspecs');
      kernelIconUrl = baseUrl + kernelIconUrl.slice(index);
      const node = document.createElement('div');
      const img = document.createElement('img');
      img.src = kernelIconUrl;
      img.title = spec.display_name;
      node.appendChild(img);
      widget = new Widget({ node });
      widget.addClass('jp-ClassicKernelLogo');
      app.shell.add(widget, 'top', { rank: 10_010 });
    };

    shell.currentChanged.connect(onChange);
  }
};

/**
 * A plugin to display the kernel status;
 */
const kernelStatus: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-classic/application-extension:kernel-status',
  autoStart: true,
  requires: [IClassicShell],
  activate: (app: JupyterFrontEnd, shell: IClassicShell) => {
    const widget = new Widget();
    widget.addClass('jp-ClassicKernelStatus');
    app.shell.add(widget, 'menu', { rank: 10_010 });

    const removeClasses = () => {
      widget.removeClass(KERNEL_STATUS_ERROR_CLASS);
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
      widget.node.textContent = text;
    };

    // TODO: this signal might not be needed if we assume there is always only
    // one notebook in the main area
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
 * The logo plugin.
 */
const logo: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-classic/application-extension:logo',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    const logo = new Widget();
    jupyterIcon.element({
      container: logo.node,
      elementPosition: 'center',
      padding: '2px 2px 2px 8px',
      height: '28px',
      width: 'auto'
    });
    logo.id = 'jp-ClassicLogo';
    app.shell.add(logo, 'top', { rank: 0 });
  }
};

/**
 * The main plugin.
 */
const main: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-classic/application-extension:main',
  autoStart: true,
  activate: () => {
    console.log(main.id, 'activated');
  }
};

/**
 * The default paths for a JupyterLab Classic app.
 */
const paths: JupyterFrontEndPlugin<JupyterFrontEnd.IPaths> = {
  id: '@jupyterlab-classic/application-extension:paths',
  activate: (app: JupyterFrontEnd): JupyterFrontEnd.IPaths => {
    if (!(app instanceof App)) {
      throw new Error(`${paths.id} must be activated in JupyterLab Classic.`);
    }
    return app.paths;
  },
  autoStart: true,
  provides: JupyterFrontEnd.IPaths
};

/**
 * The default URL router provider.
 */
const router: JupyterFrontEndPlugin<IRouter> = {
  id: '@jupyterlab-classic/application-extension:router',
  requires: [JupyterFrontEnd.IPaths],
  activate: (app: JupyterFrontEnd, paths: JupyterFrontEnd.IPaths) => {
    const { commands } = app;
    const base = paths.urls.base;
    const router = new Router({ base, commands });
    void app.started.then(() => {
      // Route the very first request on load.
      void router.route();

      // Route all pop state events.
      window.addEventListener('popstate', () => {
        void router.route();
      });
    });
    return router;
  },
  autoStart: true,
  provides: IRouter
};

/**
 * The default session dialogs plugin
 */
const sessionDialogs: JupyterFrontEndPlugin<ISessionContextDialogs> = {
  id: '@jupyterlab-classic/application-extension:sessionDialogs',
  provides: ISessionContextDialogs,
  autoStart: true,
  activate: () => sessionContextDialogs
};

/**
 * The default JupyterLab Classic application shell.
 */
const shell: JupyterFrontEndPlugin<IClassicShell> = {
  id: '@jupyterlab-classic/application-extension:shell',
  activate: (app: JupyterFrontEnd) => {
    if (!(app.shell instanceof ClassicShell)) {
      throw new Error(`${shell.id} did not find a ClassicShell instance.`);
    }
    return app.shell;
  },
  autoStart: true,
  provides: IClassicShell
};

/**
 * A plugin to provide a spacer at rank 10000 for flex panels
 */
const spacer: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-classic/application-extension:spacer',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    const top = new Widget();
    top.id = DOMUtils.createDomID();
    top.addClass('jp-ClassicSpacer');
    app.shell.add(top, 'top', { rank: 10000 });

    const menu = new Widget();
    menu.id = DOMUtils.createDomID();
    menu.addClass('jp-ClassicSpacer');
    app.shell.add(menu, 'menu', { rank: 10000 });
  }
};

/**
 * A plugin to display the title of the notebook
 */
const title: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-classic/application-extension:title',
  autoStart: true,
  requires: [IClassicShell],
  optional: [IDocumentManager, IRouter],
  activate: (
    app: JupyterFrontEnd,
    shell: IClassicShell,
    docManager: IDocumentManager | null,
    router: IRouter | null
  ) => {
    // TODO: this signal might not be needed if we assume there is always only
    // one notebook in the main area
    const widget = new Widget();
    widget.id = 'jp-title';
    app.shell.add(widget, 'top', { rank: 10 });

    shell.currentChanged.connect(async () => {
      const current = shell.currentWidget;
      if (!(current instanceof NotebookPanel)) {
        return;
      }
      const h = document.createElement('h1');
      h.textContent = current.title.label;
      widget.node.appendChild(h);
      widget.node.style.marginLeft = '10px';
      if (docManager) {
        widget.node.onclick = async () => {
          const result = await renameDialog(
            docManager,
            current.sessionContext.path
          );
          if (result) {
            h.textContent = result.path;
            if (router) {
              // TODO: better handle this
              router.navigate(`/classic/tree/${result.path}`, {
                skipRouting: true
              });
            }
          }
        };
      }
    });
  }
};

/**
 * Plugin to toggle the top header visibility.
 */
const topVisibility: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-classic/application-extension:top',
  requires: [IClassicShell],
  optional: [IMainMenu],
  activate: (
    app: JupyterFrontEnd<JupyterFrontEnd.IShell>,
    classicShell: IClassicShell,
    menu: IMainMenu | null
  ) => {
    const top = classicShell.top;

    app.commands.addCommand(CommandIDs.toggleTop, {
      label: 'Show Header',
      execute: (args: any) => {
        top.setHidden(top.isVisible);
      },
      isToggled: () => top.isVisible
    });

    if (menu) {
      menu.viewMenu.addGroup([{ command: CommandIDs.toggleTop }], 2);
    }
  },
  autoStart: true
};

/**
 * A simplified Translator
 */
const translator: JupyterFrontEndPlugin<ITranslator> = {
  id: '@jupyterlab-classic/application-extension:translator',
  activate: (app: JupyterFrontEnd<JupyterFrontEnd.IShell>): ITranslator => {
    const translationManager = new TranslationManager();
    return translationManager;
  },
  autoStart: true,
  provides: ITranslator
};

/**
 * The default tree route resolver plugin.
 */
const tree: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-classic/application-extension:tree-resolver',
  autoStart: true,
  requires: [IRouter],
  activate: (app: JupyterFrontEnd, router: IRouter): void => {
    const { commands } = app;
    const treePattern = new RegExp('/tree/(.*)');

    const command = 'router:tree';
    commands.addCommand(command, {
      execute: (args: any) => {
        const parsed = args as IRouter.ILocation;
        const matches = parsed.path.match(treePattern);
        if (!matches) {
          return;
        }
        const [, path] = matches;

        app.restored.then(() => {
          commands.execute('docmanager:open', {
            path,
            factory: NOTEBOOK_FACTORY
          });
        });
      }
    });

    router.register({ command, pattern: treePattern });
  }
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [
  checkpoints,
  kernelLogo,
  kernelStatus,
  logo,
  main,
  paths,
  router,
  sessionDialogs,
  shell,
  spacer,
  title,
  topVisibility,
  translator,
  tree
];

export default plugins;
