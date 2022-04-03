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
  consoleIcon,
  folderIcon,
  notebookIcon,
  runningIcon,
  terminalIcon
} from '@jupyterlab/ui-components';

import { TabPanel } from '@lumino/widgets';

const FILE_BROWSER_FACTORY = 'FileBrowser';

/**
 * Plugin to add extra commands to the file browser to create
 * new notebooks, files, consoles and terminals
 */
const createNew: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/tree-extension:new',
  requires: [ITranslator],
  autoStart: true,
  activate: (app: JupyterFrontEnd, translator: ITranslator) => {
    const { commands } = app;
    const trans = translator.load('notebook');

    // wrapper commands to be able to override the label
    const newNotebookCommand = 'tree:new-notebook';
    commands.addCommand(newNotebookCommand, {
      label: trans.__('New Notebook'),
      icon: notebookIcon,
      execute: () => {
        return commands.execute('notebook:create-new');
      }
    });

    commands.addCommand('tree:new-terminal', {
      label: trans.__('New Terminal'),
      icon: terminalIcon,
      execute: () => {
        return commands.execute('terminal:create-new');
      }
    });

    commands.addCommand('tree:new-console', {
      label: trans.__('New Console'),
      icon: consoleIcon,
      execute: () => {
        return commands.execute('console:create');
      }
    });
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
    settings: ISettingRegistry,
    toolbarRegistry: IToolbarWidgetRegistry,
    manager: IRunningSessionManagers | null
  ): void => {
    const tabPanel = new TabPanel({ tabPlacement: 'top', tabsMovable: true });
    tabPanel.addClass('jp-TreePanel');

    const trans = translator.load('notebook');

    const { defaultBrowser: browser } = factory;
    browser.title.label = trans.__('Files');
    browser.node.setAttribute('role', 'region');
    browser.node.setAttribute('aria-label', trans.__('File Browser Section'));
    browser.title.icon = folderIcon;

    tabPanel.addWidget(browser);
    tabPanel.tabBar.addTab(browser.title);

    // Toolbar
    toolbarRegistry.registerFactory(
      FILE_BROWSER_FACTORY,
      'uploader',
      (browser: FileBrowser) =>
        new Uploader({ model: browser.model, translator })
    );

    setToolbar(
      browser,
      createToolbarFactory(
        toolbarRegistry,
        settings,
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
      tabPanel.addWidget(running);
      tabPanel.tabBar.addTab(running.title);
    }

    app.shell.add(tabPanel, 'main', { rank: 100 });
  }
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [createNew, browserWidget];
export default plugins;
