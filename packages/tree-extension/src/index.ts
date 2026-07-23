// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import {
  ICommandPalette,
  IToolbarWidgetRegistry,
  createToolbarFactory,
  setToolbar,
} from '@jupyterlab/apputils';

import { PageConfig, PathExt, Time } from '@jupyterlab/coreutils';

import {
  FileBrowser,
  Uploader,
  IDefaultFileBrowser,
  IFileBrowserFactory,
} from '@jupyterlab/filebrowser';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import {
  IRunningSessionManagers,
  IRunningSessions,
  RunningSessionManagers,
  RunningSessions,
} from '@jupyterlab/running';

import { IRecentsManager, RecentDocument } from '@jupyterlab/docmanager';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import {
  IJSONSettingEditorTracker,
  ISettingEditorTracker,
} from '@jupyterlab/settingeditor';

import { ITranslator } from '@jupyterlab/translation';

import {
  caretDownIcon,
  fileIcon,
  folderIcon,
  historyIcon,
  LabIcon,
  runningIcon,
} from '@jupyterlab/ui-components';

import { CommandRegistry } from '@lumino/commands';

import { Signal } from '@lumino/signaling';

import { Menu, MenuBar } from '@lumino/widgets';

import { NotebookTreeWidget, INotebookTree } from '@jupyter-notebook/tree';

import { FilesActionButtons } from './fileactions';

/**
 * The file browser factory.
 */
const FILE_BROWSER_FACTORY = 'FileBrowser';

/**
 * The namespace for command IDs.
 */
namespace CommandIDs {
  // The command to show the filebrowser widget in tree view.
  export const openDirectory = 'filebrowser:open-directory';

  /**
   * @deprecated Use `filebrowser:open-directory` instead.
   */
  export const activate = 'filebrowser:activate';

  // Activate the file filter in the file browser
  export const toggleFileFilter = 'filebrowser:toggle-file-filter';
}

/**
 * Plugin to add extra commands to the file browser to create
 * new notebooks, files, consoles and terminals
 */
const createNew: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/tree-extension:new',
  description:
    'Plugin to add extra commands to the file browser to create new notebooks, files, consoles and terminals.',
  requires: [ITranslator],
  optional: [IToolbarWidgetRegistry],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    toolbarRegistry: IToolbarWidgetRegistry | null
  ) => {
    const { commands, serviceManager } = app;
    const trans = translator.load('notebook');

    const overflowOptions = {
      overflowMenuOptions: { isVisible: false },
    };
    const menubar = new MenuBar(overflowOptions);
    const newMenu = new Menu({ commands });
    newMenu.title.label = trans.__('New');
    newMenu.title.icon = caretDownIcon;
    menubar.addMenu(newMenu);

    const populateNewMenu = () => {
      // create an entry per kernel spec for creating a new notebook
      const specs = serviceManager.kernelspecs?.specs?.kernelspecs;
      for (const name in specs) {
        newMenu.addItem({
          args: { kernelName: name, isLauncher: true },
          command: 'notebook:create-new',
        });
      }

      const baseCommands = [
        'terminal:create-new',
        'console:create',
        'filebrowser:create-new-file',
        'filebrowser:create-new-directory',
      ];

      baseCommands.forEach((command) => {
        newMenu.addItem({ command });
      });
    };

    serviceManager.kernelspecs?.specsChanged.connect(() => {
      newMenu.clearItems();
      populateNewMenu();
    });

    populateNewMenu();

    if (toolbarRegistry) {
      toolbarRegistry.addFactory(
        FILE_BROWSER_FACTORY,
        'new-dropdown',
        (browser: FileBrowser) => {
          const menubar = new MenuBar(overflowOptions);
          menubar.addMenu(newMenu);
          menubar.addClass('jp-DropdownMenu');
          return menubar;
        }
      );
    }
  },
};

/**
 * A plugin to add file browser actions to the file browser toolbar.
 */
const fileActions: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/tree-extension:file-actions',
  description:
    'A plugin to add file browser actions to the file browser toolbar.',
  autoStart: true,
  requires: [IDefaultFileBrowser, IToolbarWidgetRegistry, ITranslator],
  activate: (
    app: JupyterFrontEnd,
    browser: IDefaultFileBrowser,
    toolbarRegistry: IToolbarWidgetRegistry,
    translator: ITranslator
  ) => {
    // Create a toolbar item that adds buttons to the file browser toolbar
    // to perform actions on the files
    const { commands } = app;
    const { selectionChanged } = browser;
    const fileActions = new FilesActionButtons({
      commands,
      browser,
      selectionChanged,
      translator,
    });
    for (const widget of fileActions.widgets) {
      toolbarRegistry.addFactory(FILE_BROWSER_FACTORY, widget.id, () => widget);
    }
  },
};

/**
 * A plugin to add the file filter toggle command to the palette
 */
const fileFilterCommand: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/tree-extension:file-filter-command',
  description: 'A plugin to add file filter command to the palette.',
  autoStart: true,
  optional: [ICommandPalette],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette | null) => {
    if (palette) {
      palette.addItem({
        command: CommandIDs.toggleFileFilter,
        category: 'File Browser',
      });
    }
  },
};

/**
 * Plugin to load the default plugins that are loaded on all the Notebook pages
 * (tree, edit, view, etc.) so they are visible in the settings editor.
 */
const loadPlugins: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/tree-extension:load-plugins',
  description:
    'Plugin to load the default plugins that are loaded on all the Notebook pages (tree, edit, view, etc.) so they are visible in the settings editor.',
  autoStart: true,
  requires: [ISettingRegistry],
  activate(app: JupyterFrontEnd, settingRegistry: ISettingRegistry) {
    const { isDisabled } = PageConfig.Extension;
    const connector = settingRegistry.connector;

    const allPluginsOption = PageConfig.getOption('allPlugins');
    if (!allPluginsOption) {
      return;
    }

    // build the list of plugins shipped by default on the all the notebook pages
    // this avoid explicitly loading `'all'` plugins such as the ones used
    // in JupyterLab only
    const allPlugins = JSON.parse(allPluginsOption);
    const pluginsSet = new Set<string>();
    Object.keys(allPlugins).forEach((key: string) => {
      const extensionsAndPlugins: { [key: string]: boolean | [string] } =
        allPlugins[key];
      Object.keys(extensionsAndPlugins).forEach((plugin) => {
        const value = extensionsAndPlugins[plugin];
        if (typeof value === 'boolean' && value) {
          pluginsSet.add(plugin);
        } else if (Array.isArray(value)) {
          value.forEach((v: string) => {
            pluginsSet.add(v);
          });
        }
      });
    });

    app.restored.then(async () => {
      const plugins = await connector.list('all');
      await Promise.all(
        plugins.ids.map(async (id: string) => {
          const [extension] = id.split(':');
          // load the plugin if it is built-in the notebook application explicitly
          // either included as an extension or as a plugin directly
          const hasPlugin = pluginsSet.has(extension) || pluginsSet.has(id);
          if (!hasPlugin || isDisabled(id) || id in settingRegistry.plugins) {
            return;
          }
          try {
            await settingRegistry.load(id);
          } catch (error) {
            console.warn(`Settings failed to load for (${id})`, error);
          }
        })
      );
    });
  },
};

/**
 * A plugin to add file browser commands for the tree view.
 */
const openFileBrowser: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/tree-extension:open-file-browser',
  description: 'A plugin to add file browser commands for the tree view.',
  requires: [INotebookTree, IDefaultFileBrowser],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    notebookTree: INotebookTree,
    browser: IDefaultFileBrowser
  ) => {
    const { commands } = app;
    commands.addCommand(CommandIDs.openDirectory, {
      execute: () => {
        notebookTree.currentWidget = browser;
      },
      describedBy: {
        args: {
          type: 'object',
          properties: {},
        },
      },
    });

    // Backward-compatible alias for older command ID.
    commands.addCommand(CommandIDs.activate, {
      execute: (args) => commands.execute(CommandIDs.openDirectory, args),
      describedBy: {
        args: {
          type: 'object',
          properties: {},
        },
      },
    });
  },
};

/**
 * A plugin to add the file browser widget to an INotebookShell
 */
const notebookTreeWidget: JupyterFrontEndPlugin<INotebookTree> = {
  id: '@jupyter-notebook/tree-extension:widget',
  description: 'A plugin to add the file browser widget to an INotebookShell.',
  requires: [
    IDefaultFileBrowser,
    ITranslator,
    ISettingRegistry,
    IToolbarWidgetRegistry,
    IFileBrowserFactory,
  ],
  optional: [
    IRunningSessionManagers,
    ISettingEditorTracker,
    IJSONSettingEditorTracker,
  ],
  autoStart: true,
  provides: INotebookTree,
  activate: (
    app: JupyterFrontEnd,
    browser: IDefaultFileBrowser,
    translator: ITranslator,
    settingRegistry: ISettingRegistry,
    toolbarRegistry: IToolbarWidgetRegistry,
    factory: IFileBrowserFactory,
    manager: IRunningSessionManagers | null,
    settingEditorTracker: ISettingEditorTracker | null,
    jsonSettingEditorTracker: IJSONSettingEditorTracker | null
  ): INotebookTree => {
    const nbTreeWidget = new NotebookTreeWidget();

    const trans = translator.load('notebook');

    browser.title.label = trans.__('Files');
    browser.node.setAttribute('role', 'region');
    browser.node.setAttribute('aria-label', trans.__('File Browser Section'));
    browser.title.icon = folderIcon;

    nbTreeWidget.addWidget(browser);
    nbTreeWidget.tabBar.addTab(browser.title);
    nbTreeWidget.tabsMovable = false;

    toolbarRegistry.addFactory(
      FILE_BROWSER_FACTORY,
      'uploader',
      (browser: FileBrowser) =>
        new Uploader({
          model: browser.model,
          translator,
          label: trans.__('Upload'),
        })
    );

    setToolbar(
      browser,
      createToolbarFactory(
        toolbarRegistry,
        settingRegistry,
        FILE_BROWSER_FACTORY,
        notebookTreeWidget.id,
        translator
      )
    );

    if (manager) {
      const running = new RunningSessions(manager, translator);
      running.id = 'jp-running-sessions-tree';
      running.title.label = trans.__('Running');
      running.title.icon = runningIcon;
      nbTreeWidget.addWidget(running);
      nbTreeWidget.tabBar.addTab(running.title);
    }

    app.shell.add(nbTreeWidget, 'main', { rank: 100 });

    // add a separate tab for each setting editor
    [settingEditorTracker, jsonSettingEditorTracker].forEach(
      (editorTracker) => {
        if (editorTracker) {
          editorTracker.widgetAdded.connect((_, editor) => {
            nbTreeWidget.addWidget(editor);
            nbTreeWidget.tabBar.addTab(editor.title);
            nbTreeWidget.currentWidget = editor;
          });
        }
      }
    );

    const { tracker } = factory;

    // TODO: remove
    // Workaround to force the focus on the default file browser
    // See https://github.com/jupyterlab/jupyterlab/issues/15629 for more info
    const setCurrentToDefaultBrower = () => {
      tracker['_pool'].current = browser;
    };

    tracker.widgetAdded.connect((sender, widget) => {
      setCurrentToDefaultBrower();
    });

    setCurrentToDefaultBrower();

    return nbTreeWidget;
  },
};

/**
 * Add a "Recently Opened" section to a running panel, listing the documents
 * most recently opened in the application.
 *
 * This mirrors JupyterLab's `addRecentlyClosedSessionManager` from
 * `@jupyterlab/running-extension`, but surfaces the recently *opened* documents
 * tracked by the `IRecentsManager`.
 */
function addRecentlyOpenedSessionManager(
  managers: IRunningSessionManagers,
  recentsManager: IRecentsManager,
  commands: CommandRegistry,
  docRegistry: DocumentRegistry,
  translator: ITranslator
): void {
  const trans = translator.load('notebook');

  // Wrap the manager `changed` signal so the refresh button can also force a
  // re-render, which is enough to pick up documents recorded by other pages
  // since the list is re-read from the shared local storage on each render.
  const runningChanged = new Signal<IRecentsManager, void>(recentsManager);
  recentsManager.changed.connect(() => runningChanged.emit(undefined));

  managers.add({
    name: trans.__('Recently Opened'),
    supportsMultipleViews: false,
    running: () => {
      // Only list documents, not the parent directories that are also recorded
      // as recently opened by the document manager.
      return recentsManager.recentlyOpened
        .filter((recent) => recent.contentType !== 'directory')
        .map((recent) => new RecentItem(recent));
    },
    shutdownAll: () => {
      for (const recent of recentsManager.recentlyOpened) {
        recentsManager.removeRecent(recent, 'opened');
      }
    },
    refreshRunning: () => {
      // drop entries pointing to files that no longer exist, and re-render
      for (const recent of recentsManager.recentlyOpened) {
        void recentsManager.validate(recent);
      }
      runningChanged.emit(undefined);
    },
    runningChanged,
    shutdownLabel: trans.__('Forget'),
    shutdownAllLabel: trans.__('Forget All'),
    shutdownAllConfirmationText: trans.__(
      'Are you sure you want to clear the list of recently opened documents?'
    ),
  });

  class RecentItem implements IRunningSessions.IRunningItem {
    constructor(recent: RecentDocument) {
      this._recent = recent;
    }
    async open() {
      const recent = this._recent;
      const isValid = await recentsManager.validate(recent);
      if (!isValid) {
        return;
      }
      // On the tree page this navigates to the document in a new browser tab
      // via the Notebook document opener.
      await commands.execute('docmanager:open', {
        path: recent.path,
        factory: recent.factory,
      });
    }
    shutdown() {
      recentsManager.removeRecent(this._recent, 'opened');
    }
    icon() {
      const fileTypes = docRegistry.getFileTypesForPath(this._recent.path);
      for (const fileType of fileTypes) {
        if (fileType.icon instanceof LabIcon) {
          return fileType.icon;
        }
      }
      return fileIcon;
    }
    label() {
      return PathExt.basename(this._recent.path);
    }
    labelTitle() {
      return this._recent.path;
    }
    detail() {
      // the last opened time is an extra field stamped by the Notebook
      // recents manager on top of JupyterLab's `RecentDocument`
      const { lastOpened } = this._recent as RecentDocument & {
        lastOpened?: number;
      };
      return lastOpened ? Time.formatHuman(new Date(lastOpened), 'short') : '';
    }

    private _recent: RecentDocument;
  }
}

/**
 * A plugin to add a tab listing recently opened documents to the tree view.
 */
const recents: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/tree-extension:recents',
  description:
    'A plugin to add a tab listing recently opened documents to the tree view.',
  requires: [INotebookTree, ITranslator],
  optional: [IRecentsManager],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    notebookTree: INotebookTree,
    translator: ITranslator,
    recentsManager: IRecentsManager | null
  ): void => {
    // The recents manager is optional: without it there is nothing to show.
    if (!recentsManager) {
      return;
    }
    const { commands, docRegistry } = app;
    const trans = translator.load('notebook');

    // Drop entries pointing to files that no longer exist. This is done on
    // the tree page only, so the other pages (notebooks, edit, ...) do not
    // send a request per recent document on every load.
    for (const recent of [
      ...recentsManager.recentlyOpened,
      ...recentsManager.recentlyClosed,
    ]) {
      void recentsManager.validate(recent);
    }

    // Use a dedicated running session managers instance so the recents list
    // does not get mixed into the "Running" tab.
    const managers = new RunningSessionManagers();
    addRecentlyOpenedSessionManager(
      managers,
      recentsManager,
      commands,
      docRegistry,
      translator
    );

    const recentsPanel = new RunningSessions(managers, translator);
    recentsPanel.id = 'jp-recents-tree';
    recentsPanel.title.label = trans.__('Recents');
    recentsPanel.title.icon = historyIcon;
    recentsPanel.node.setAttribute('role', 'region');
    recentsPanel.node.setAttribute(
      'aria-label',
      trans.__('Recently Opened Documents Section')
    );

    notebookTree.addWidget(recentsPanel);
    notebookTree.tabBar.addTab(recentsPanel.title);
  },
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [
  createNew,
  fileActions,
  fileFilterCommand,
  loadPlugins,
  openFileBrowser,
  notebookTreeWidget,
  recents,
];
export default plugins;
