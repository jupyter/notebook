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
  DOMUtils,
  ICommandPalette
} from '@jupyterlab/apputils';

import { PageConfig, PathExt } from '@jupyterlab/coreutils';

import { IDocumentManager, renameDialog } from '@jupyterlab/docmanager';

import { DocumentWidget } from '@jupyterlab/docregistry';

import { IMainMenu } from '@jupyterlab/mainmenu';

import { ITranslator, TranslationManager } from '@jupyterlab/translation';

import { RetroApp, RetroShell, IRetroShell } from '@retrolab/application';

import { jupyterIcon, retroInlineIcon } from '@retrolab/ui-components';

import { Widget } from '@lumino/widgets';

/**
 * The default notebook factory.
 */
const NOTEBOOK_FACTORY = 'Notebook';

/**
 * The editor factory.
 */
const EDITOR_FACTORY = 'Editor';

/**
 * A regular expression to match path to notebooks and documents
 */
const TREE_PATTERN = new RegExp('/(notebooks|edit)/(.*)');

/**
 * The command IDs used by the application plugin.
 */
namespace CommandIDs {
  /**
   * Toggle Top Bar visibility
   */
  export const toggleTop = 'application:toggle-top';

  /**
   * Toggle the Zen mode
   */
  export const toggleZen = 'application:toggle-zen';

  /**
   * Open JupyterLab
   */
  export const openLab = 'application:open-lab';

  /**
   * Open the tree page.
   */
  export const openTree = 'application:open-tree';
}

/**
 * The logo plugin.
 */
const logo: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/application-extension:logo',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    const baseUrl = PageConfig.getBaseUrl();
    const node = document.createElement('a');
    node.href = `${baseUrl}retro/tree`;
    node.target = '_blank';
    node.rel = 'noopener noreferrer';
    const logo = new Widget({ node });

    const retroLogo = PageConfig.getOption('retroLogo') === 'true';
    const icon = retroLogo ? retroInlineIcon : jupyterIcon;
    icon.element({
      container: node,
      elementPosition: 'center',
      padding: '2px 2px 2px 8px',
      height: '28px',
      width: 'auto'
    });
    logo.id = 'jp-RetroLogo';
    app.shell.add(logo, 'top', { rank: 0 });
  }
};

/**
 * A plugin to open documents in the main area.
 */
const opener: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/application-extension:opener',
  autoStart: true,
  requires: [IRouter, IDocumentManager],
  activate: (
    app: JupyterFrontEnd,
    router: IRouter,
    docManager: IDocumentManager
  ): void => {
    const { commands } = app;

    const command = 'router:tree';
    commands.addCommand(command, {
      execute: (args: any) => {
        const parsed = args as IRouter.ILocation;
        const matches = parsed.path.match(TREE_PATTERN) ?? [];
        const [, , path] = matches;
        if (!path) {
          return;
        }

        const file = decodeURIComponent(path);
        const ext = PathExt.extname(file);
        app.restored.then(() => {
          // TODO: get factory from file type instead?
          if (ext === '.ipynb') {
            docManager.open(file, NOTEBOOK_FACTORY, undefined, {
              ref: '_noref'
            });
          } else {
            docManager.open(file, EDITOR_FACTORY, undefined, {
              ref: '_noref'
            });
          }
        });
      }
    });

    router.register({ command, pattern: TREE_PATTERN });
  }
};

/**
 * A plugin to dispose the Tabs menu
 */
const noTabsMenu: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/application-extension:no-tabs-menu',
  requires: [IMainMenu],
  autoStart: true,
  activate: (app: JupyterFrontEnd, menu: IMainMenu) => {
    menu.tabsMenu.dispose();
  }
};

/**
 * Add commands to open the tree and running pages.
 */
const pages: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/application-extension:pages',
  autoStart: true,
  optional: [ICommandPalette, IMainMenu],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    menu: IMainMenu
  ): void => {
    const baseUrl = PageConfig.getBaseUrl();

    app.commands.addCommand(CommandIDs.openLab, {
      label: 'Open JupyterLab',
      execute: () => {
        window.open(`${baseUrl}lab`);
      }
    });

    app.commands.addCommand(CommandIDs.openTree, {
      label: 'Open Files',
      execute: () => {
        window.open(`${baseUrl}retro/tree`);
      }
    });

    if (palette) {
      [CommandIDs.openLab, CommandIDs.openTree].forEach(command => {
        palette.addItem({ command, category: 'View' });
      });
    }

    if (menu) {
      menu.viewMenu.addGroup(
        [{ command: CommandIDs.openLab }, { command: CommandIDs.openTree }],
        0
      );
    }
  }
};

/**
 * The default paths for a RetroLab app.
 */
const paths: JupyterFrontEndPlugin<JupyterFrontEnd.IPaths> = {
  id: '@retrolab/application-extension:paths',
  autoStart: true,
  provides: JupyterFrontEnd.IPaths,
  activate: (app: JupyterFrontEnd): JupyterFrontEnd.IPaths => {
    if (!(app instanceof RetroApp)) {
      throw new Error(`${paths.id} must be activated in RetroLab.`);
    }
    return app.paths;
  }
};

/**
 * The default URL router provider.
 */
const router: JupyterFrontEndPlugin<IRouter> = {
  id: '@retrolab/application-extension:router',
  autoStart: true,
  provides: IRouter,
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
  }
};

/**
 * The default session dialogs plugin
 */
const sessionDialogs: JupyterFrontEndPlugin<ISessionContextDialogs> = {
  id: '@retrolab/application-extension:session-dialogs',
  provides: ISessionContextDialogs,
  autoStart: true,
  activate: () => sessionContextDialogs
};

/**
 * The default RetroLab application shell.
 */
const shell: JupyterFrontEndPlugin<IRetroShell> = {
  id: '@retrolab/application-extension:shell',
  activate: (app: JupyterFrontEnd) => {
    if (!(app.shell instanceof RetroShell)) {
      throw new Error(`${shell.id} did not find a RetroShell instance.`);
    }
    return app.shell;
  },
  autoStart: true,
  provides: IRetroShell
};

/**
 * A plugin to provide a spacer at rank 10000 for flex panels
 */
const spacer: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/application-extension:spacer',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    const top = new Widget();
    top.id = DOMUtils.createDomID();
    top.addClass('jp-RetroSpacer');
    app.shell.add(top, 'top', { rank: 10000 });

    const menu = new Widget();
    menu.id = DOMUtils.createDomID();
    menu.addClass('jp-RetroSpacer');
    app.shell.add(menu, 'menu', { rank: 10000 });
  }
};

/**
 * A plugin to display the document title in the browser tab title
 */
const tabTitle: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/application-extension:tab-title',
  autoStart: true,
  requires: [IRetroShell],
  activate: (app: JupyterFrontEnd, shell: IRetroShell) => {
    const setTabTitle = () => {
      const current = shell.currentWidget;
      if (!(current instanceof DocumentWidget)) {
        return;
      }
      const update = () => {
        const basename = PathExt.basename(current.context.path);
        document.title = basename;
      };
      current.context.pathChanged.connect(update);
      update();
    };

    shell.currentChanged.connect(setTabTitle);
    setTabTitle();
  }
};

/**
 * A plugin to display and rename the title of a file
 */
const title: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/application-extension:title',
  autoStart: true,
  requires: [IRetroShell],
  optional: [IDocumentManager, IRouter],
  activate: (
    app: JupyterFrontEnd,
    shell: IRetroShell,
    docManager: IDocumentManager | null,
    router: IRouter | null
  ) => {
    const widget = new Widget();
    widget.id = 'jp-title';
    app.shell.add(widget, 'top', { rank: 10 });

    const addTitle = async () => {
      const current = shell.currentWidget;
      if (!current || !(current instanceof DocumentWidget)) {
        return;
      }
      if (widget.node.children.length > 0) {
        return;
      }
      const h = document.createElement('h1');
      h.textContent = current.title.label;
      widget.node.appendChild(h);
      widget.node.style.marginLeft = '10px';
      if (!docManager) {
        return;
      }
      widget.node.onclick = async () => {
        const result = await renameDialog(docManager, current.context.path);

        // activate the current widget to bring the focus
        if (current) {
          current.activate();
        }

        if (!result) {
          return;
        }

        const basename = PathExt.basename(result.path);
        h.textContent = basename;
        if (!router) {
          return;
        }
        const matches = router.current.path.match(TREE_PATTERN) ?? [];
        const [, route, path] = matches;
        if (!route || !path) {
          return;
        }
        const encoded = encodeURIComponent(result.path);
        router.navigate(`/retro/${route}/${encoded}`, {
          skipRouting: true
        });
      };
    };

    shell.currentChanged.connect(addTitle);
    addTitle();
  }
};

/**
 * Plugin to toggle the top header visibility.
 */
const topVisibility: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/application-extension:top',
  requires: [IRetroShell],
  optional: [IMainMenu],
  activate: (
    app: JupyterFrontEnd<JupyterFrontEnd.IShell>,
    retroShell: IRetroShell,
    menu: IMainMenu | null
  ) => {
    const top = retroShell.top;

    app.commands.addCommand(CommandIDs.toggleTop, {
      label: 'Show Header',
      execute: () => {
        top.setHidden(top.isVisible);
      },
      isToggled: () => top.isVisible
    });

    if (menu) {
      menu.viewMenu.addGroup([{ command: CommandIDs.toggleTop }], 2);
    }

    const onChanged = (): void => {
      if (app.format === 'desktop') {
        retroShell.expandTop();
      } else {
        retroShell.collapseTop();
      }
    };

    // listen on format change (mobile and desktop) to make the view more compact
    app.formatChanged.connect(onChanged);
    onChanged();
  },
  autoStart: true
};

/**
 * A simplified Translator
 */
const translator: JupyterFrontEndPlugin<ITranslator> = {
  id: '@retrolab/application-extension:translator',
  activate: (app: JupyterFrontEnd<JupyterFrontEnd.IShell>): ITranslator => {
    const translationManager = new TranslationManager();
    return translationManager;
  },
  autoStart: true,
  provides: ITranslator
};

/**
 * Zen mode plugin
 */
const zen: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/application-extension:zen',
  autoStart: true,
  optional: [ICommandPalette, IRetroShell, IMainMenu],
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette | null,
    retroShell: IRetroShell | null,
    menu: IMainMenu | null
  ): void => {
    const { commands } = app;
    const elem = document.documentElement;

    const toggleOn = () => {
      retroShell?.collapseTop();
      retroShell?.menu.setHidden(true);
      zenModeEnabled = true;
    };

    const toggleOff = () => {
      retroShell?.expandTop();
      retroShell?.menu.setHidden(false);
      zenModeEnabled = false;
    };

    let zenModeEnabled = false;
    commands.addCommand(CommandIDs.toggleZen, {
      label: 'Toggle Zen Mode',
      execute: () => {
        if (!zenModeEnabled) {
          elem.requestFullscreen();
          toggleOn();
        } else {
          document.exitFullscreen();
          toggleOff();
        }
      }
    });

    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        toggleOff();
      }
    });

    if (palette) {
      palette.addItem({ command: CommandIDs.toggleZen, category: 'Mode' });
    }

    if (menu) {
      menu.viewMenu.addGroup([{ command: CommandIDs.toggleZen }], 3);
    }
  }
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [
  logo,
  noTabsMenu,
  opener,
  pages,
  paths,
  router,
  sessionDialogs,
  shell,
  spacer,
  tabTitle,
  title,
  topVisibility,
  translator,
  zen
];

export default plugins;
