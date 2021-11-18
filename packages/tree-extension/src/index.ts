// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { CommandToolbarButton } from '@jupyterlab/apputils';

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { IRunningSessionManagers, RunningSessions } from '@jupyterlab/running';

import { ITranslator } from '@jupyterlab/translation';

import {
  consoleIcon,
  notebookIcon,
  runningIcon,
  terminalIcon
} from '@jupyterlab/ui-components';

import { TabPanel } from '@lumino/widgets';

/**
 * Plugin to add extra buttons to the file browser to create new notebooks and files
 */
const newFiles: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/tree-extension:buttons',
  requires: [IFileBrowserFactory, ITranslator],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    filebrowser: IFileBrowserFactory,
    translator: ITranslator
  ) => {
    const { commands } = app;
    const browser = filebrowser.defaultBrowser;
    const trans = translator.load('retrolab');

    // wrapper commands to be able to override the label
    const newNotebookCommand = 'tree:new-notebook';
    commands.addCommand(newNotebookCommand, {
      label: trans.__('New Notebook'),
      icon: notebookIcon,
      execute: () => {
        return commands.execute('notebook:create-new');
      }
    });

    const newNotebook = new CommandToolbarButton({
      commands,
      id: newNotebookCommand
    });

    const newFile = new CommandToolbarButton({
      commands,
      id: 'filebrowser:create-new-file'
    });

    browser.toolbar.insertItem(0, 'new-notebook', newNotebook);
    browser.toolbar.insertItem(1, 'new-file', newFile);
  }
};

/**
 * Plugin to add a "New Console" button to the file browser toolbar.
 */
const newConsole: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/tree-extension:new-console',
  requires: [IFileBrowserFactory, ITranslator],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    filebrowser: IFileBrowserFactory,
    translator: ITranslator
  ) => {
    const { commands } = app;
    const browser = filebrowser.defaultBrowser;
    const trans = translator.load('retrolab');

    const newConsoleCommand = 'tree:new-console';
    commands.addCommand(newConsoleCommand, {
      label: trans.__('New Console'),
      icon: consoleIcon,
      execute: () => {
        return commands.execute('console:create');
      }
    });

    const newConsole = new CommandToolbarButton({
      commands,
      id: newConsoleCommand
    });

    browser.toolbar.insertItem(2, 'new-console', newConsole);
  }
};

/**
 * Plugin to add a "New Terminal" button to the file browser toolbar.
 */
const newTerminal: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/tree-extension:new-terminal',
  requires: [IFileBrowserFactory, ITranslator],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    filebrowser: IFileBrowserFactory,
    translator: ITranslator
  ) => {
    const { commands } = app;
    const browser = filebrowser.defaultBrowser;
    const trans = translator.load('retrolab');

    const newTerminalCommand = 'tree:new-terminal';
    commands.addCommand(newTerminalCommand, {
      label: trans.__('New Terminal'),
      icon: terminalIcon,
      execute: () => {
        return commands.execute('terminal:create-new');
      }
    });

    const newTerminal = new CommandToolbarButton({
      commands,
      id: newTerminalCommand
    });

    browser.toolbar.insertItem(3, 'new-terminal', newTerminal);
  }
};

/**
 * A plugin to add the file browser widget to an ILabShell
 */
const browserWidget: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/tree-extension:widget',
  requires: [IFileBrowserFactory, ITranslator],
  optional: [IRunningSessionManagers],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    factory: IFileBrowserFactory,
    translator: ITranslator,
    manager: IRunningSessionManagers | null
  ): void => {
    const tabPanel = new TabPanel({ tabPlacement: 'top', tabsMovable: true });
    tabPanel.addClass('jp-TreePanel');

    const trans = translator.load('retrolab');

    const { defaultBrowser: browser } = factory;
    browser.title.label = trans.__('Files');
    tabPanel.addWidget(browser);
    tabPanel.tabBar.addTab(browser.title);

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
const plugins: JupyterFrontEndPlugin<any>[] = [
  newFiles,
  newConsole,
  newTerminal,
  browserWidget
];
export default plugins;
