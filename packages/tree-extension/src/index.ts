// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  IToolbarWidgetRegistry,
  createToolbarFactory,
  setToolbar
} from '@jupyterlab/apputils';

import {
  IFileBrowserFactory,
  FileBrowser,
  Uploader
} from '@jupyterlab/filebrowser';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { IRunningSessionManagers, RunningSessions } from '@jupyterlab/running';

import { ITranslator } from '@jupyterlab/translation';

import {
  caretDownIcon,
  folderIcon,
  runningIcon
} from '@jupyterlab/ui-components';

import { Menu, MenuBar, TabPanel } from '@lumino/widgets';
import { NotebookShell } from '@jupyter-notebook/application';

/**
 * The file browser factory.
 */
const FILE_BROWSER_FACTORY = 'FileBrowser';

/**
 * The file browser plugin id.
 */
const FILE_BROWSER_PLUGIN_ID = '@jupyterlab/filebrowser-extension:browser';

/**
 * Plugin to add extra commands to the file browser to create
 * new notebooks, files, consoles and terminals
 */
const createNew: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/tree-extension:new',
  requires: [ITranslator],
  optional: [IToolbarWidgetRegistry],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    toolbarRegistry: IToolbarWidgetRegistry | null
  ) => {
    const { commands } = app;
    const trans = translator.load('notebook');

    const menubar = new MenuBar();
    const newMenu = new Menu({ commands });
    newMenu.title.label = trans.__('New');
    newMenu.title.icon = caretDownIcon;
    menubar.addMenu(newMenu);

    const newCommands = [
      'notebook:create-new',
      'terminal:create-new',
      'console:create',
      'filebrowser:create-new-file',
      'filebrowser:create-new-directory'
    ];

    newCommands.forEach(command => {
      newMenu.addItem({ command });
    });

    if (toolbarRegistry) {
      toolbarRegistry.addFactory(
        FILE_BROWSER_FACTORY,
        'new-dropdown',
        (browser: FileBrowser) => {
          const menubar = new MenuBar();
          menubar.addMenu(newMenu);
          menubar.addClass('jp-DropdownMenu');
          return menubar;
        }
      );
    }
  }
};

/**
 * A plugin to add the file browser widget to an ILabShell
 */
const browserWidget: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/tree-extension:widget',
  requires: [
    IFileBrowserFactory,
    ITranslator,
    ISettingRegistry,
    IToolbarWidgetRegistry
  ],
  optional: [IRunningSessionManagers],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    factory: IFileBrowserFactory,
    translator: ITranslator,
    settingRegistry: ISettingRegistry,
    toolbarRegistry: IToolbarWidgetRegistry,
    manager: IRunningSessionManagers | null
  ): void => {
    const tabPanel = new TabPanel({ tabPlacement: 'top', tabsMovable: true });
    tabPanel.addClass('jp-TreePanel');

    // Add the TabPanel to the main area.
    app.shell.add(tabPanel, 'main', { rank: 100 });
    // Set the main area as a TabPanel.
    (app.shell as NotebookShell).mainIsTabPanel = true;

    const trans = translator.load('notebook');

    const { defaultBrowser: browser } = factory;
    browser.title.label = trans.__('Files');
    browser.node.setAttribute('role', 'region');
    browser.node.setAttribute('aria-label', trans.__('File Browser Section'));
    browser.title.icon = folderIcon;

    app.shell.add(browser, 'main');

    // Toolbar
    toolbarRegistry.addFactory(
      FILE_BROWSER_FACTORY,
      'uploader',
      (browser: FileBrowser) =>
        new Uploader({
          model: browser.model,
          translator,
          label: trans.__('Upload')
        })
    );

    setToolbar(
      browser,
      createToolbarFactory(
        toolbarRegistry,
        settingRegistry,
        FILE_BROWSER_FACTORY,
        browserWidget.id,
        translator
      )
    );

    if (manager) {
      const running = new RunningSessions(manager, translator);
      running.id = 'jp-running-sessions';
      running.title.label = trans.__('Running');
      running.title.icon = runningIcon;
      app.shell.add(running, 'main');
    }

    // show checkboxes by default if there is no user setting override
    const settings = settingRegistry.load(FILE_BROWSER_PLUGIN_ID);
    Promise.all([settings, app.restored])
      .then(([settings]) => {
        if (settings.user.showFileCheckboxes !== undefined) {
          return;
        }
        void settings.set('showFileCheckboxes', true);
      })
      .catch((reason: Error) => {
        console.error(reason.message);
      });
  }
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [createNew, browserWidget];
export default plugins;
