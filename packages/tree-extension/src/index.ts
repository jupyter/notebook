// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import {
  ICommandPalette,
  IToolbarWidgetRegistry,
  Notification,
  ToolbarButton,
  createToolbarFactory,
  setToolbar,
} from '@jupyterlab/apputils';

import { PageConfig } from '@jupyterlab/coreutils';

import {
  FileBrowser,
  IDefaultFileBrowser,
  IFileBrowserFactory,
} from '@jupyterlab/filebrowser';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ServerConnection } from '@jupyterlab/services';
import { IRunningSessionManagers, RunningSessions } from '@jupyterlab/running';

import {
  IJSONSettingEditorTracker,
  ISettingEditorTracker,
} from '@jupyterlab/settingeditor';

import { ITranslator } from '@jupyterlab/translation';

import {
  caretDownIcon,
  folderIcon,
  runningIcon,
  terminalIcon,
  fileUploadIcon,
} from '@jupyterlab/ui-components';

import { Menu, MenuBar } from '@lumino/widgets';

import { NotebookTreeWidget, INotebookTree } from '@jupyter-notebook/tree';

import { FilesActionButtons } from './fileactions';

/**
 * Formats bytes into clean human-readable units.
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Retrieves a cookie value by name.
 */
function getCookie(name: string): string | undefined {
  const matches = document.cookie.match('\\b' + name + '=([^;]*)\\b');
  return matches ? matches[1] : undefined;
}

/**
 * Uploads a file with real-time percentage and byte notifications.
 */
function uploadWithProgress(file: File, targetPath: string): Promise<void> {
  const notifId = Notification.emit(
    `Uploading ${file.name}...`,
    'in-progress',
    {
      autoClose: false,
    }
  );

  return new Promise((resolve, reject) => {
    const settings = ServerConnection.makeSettings();
    const cleanPath = targetPath ? `${targetPath}/${file.name}` : file.name;
    const url = `${settings.baseUrl}api/contents/${cleanPath
      .split('/')
      .map(encodeURIComponent)
      .join('/')}`;

    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.withCredentials = true;
    xhr.timeout = 600000;

    // 1. Copy all standard headers provided by JupyterLab's ServerConnection
    if (settings.init && settings.init.headers) {
      const headers = new Headers(settings.init.headers);
      headers.forEach((value, key) => {
        // Exclude content-type here since it is set above
        if (key.toLowerCase() !== 'content-type') {
          xhr.setRequestHeader(key, value);
        }
      });
    }

    // 2. Ensure XSRF token is present
    const xsrf = getCookie('_xsrf') || PageConfig.getOption('xsrfToken');
    if (xsrf) {
      xhr.setRequestHeader('X-XSRFToken', xsrf);
    }

    // 3. Fallback token header if not already applied
    if (settings.token && !xhr.getResponseHeader('Authorization')) {
      xhr.setRequestHeader('Authorization', `Token ${settings.token}`);
    }

    xhr.upload.onprogress = (event: ProgressEvent) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        Notification.update({
          id: notifId,
          message: `Uploading ${file.name}: ${formatFileSize(
            event.loaded
          )} / ${formatFileSize(event.total)} (${percent}%)`,
          type: 'in-progress',
        });
      }
    };

    xhr.ontimeout = () => {
      Notification.update({
        id: notifId,
        message: `Upload timed out for ${file.name}`,
        type: 'error',
        autoClose: 7000,
      });
      reject(new Error('Request timed out'));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        Notification.update({
          id: notifId,
          message: `Successfully uploaded ${file.name}`,
          type: 'success',
          autoClose: 3000,
        });
        resolve();
      } else if (xhr.status === 413) {
        Notification.update({
          id: notifId,
          message: `Upload failed: ${file.name} exceeds server size limits (413).`,
          type: 'error',
          autoClose: 7000,
        });
        reject(new Error('File exceeds upload size limit (413)'));
      } else {
        const msg = `Upload failed: ${xhr.statusText || xhr.status}`;
        Notification.update({
          id: notifId,
          message: msg,
          type: 'error',
          autoClose: 5000,
        });
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => {
      Notification.update({
        id: notifId,
        message: `Network error while uploading ${file.name}`,
        type: 'error',
        autoClose: 5000,
      });
      reject(new Error('Network error'));
    };

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      const base64Index = resultStr.indexOf(';base64,');
      const base64Content =
        base64Index !== -1 ? resultStr.substring(base64Index + 8) : resultStr;

      const body = JSON.stringify({
        name: file.name,
        path: cleanPath,
        type: 'file',
        format: 'base64',
        content: base64Content,
      });

      xhr.send(body);
    };

    reader.onerror = () => {
      Notification.update({
        id: notifId,
        message: `Failed to read ${file.name}`,
        type: 'error',
        autoClose: 5000,
      });
      reject(new Error('File read error'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Dedicated Upload button widget that manages its own file input and progress handler.
 */
class ProgressUploaderButton extends ToolbarButton {
  private _fileInput: HTMLInputElement;
  private _browser: FileBrowser;

  constructor(browser: FileBrowser, label: string) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.style.display = 'none';

    super({
      icon: fileUploadIcon,
      label: label,
      onClick: () => {
        input.value = '';
        input.click();
      },
    });

    this._browser = browser;
    this._fileInput = input;
    document.body.appendChild(this._fileInput);

    this._fileInput.addEventListener('change', async () => {
      const files = this._fileInput.files;
      if (!files || files.length === 0) {
        return;
      }

      const targetPath = this._browser.model.path;
      for (let i = 0; i < files.length; i++) {
        try {
          await uploadWithProgress(files[i], targetPath);
        } catch (err) {
          console.error(err);
        }
      }

      await this._browser.model.refresh();
      this._fileInput.value = '';
    });
  }

  override dispose(): void {
    if (this._fileInput && this._fileInput.parentNode) {
      this._fileInput.parentNode.removeChild(this._fileInput);
    }
    super.dispose();
  }
}

/**
 * The file browser factory.
 */
const FILE_BROWSER_FACTORY = 'FileBrowser';

/**
 * The namespace for command IDs.
 */
namespace CommandIDs {
  export const createNewTerminal = 'filebrowser:create-new-terminal';
  export const openDirectory = 'filebrowser:open-directory';
  export const activate = 'filebrowser:activate';
  export const toggleFileFilter = 'filebrowser:toggle-file-filter';
}

/**
 * Plugin to add extra commands to the file browser to create
 * new notebooks, files, consoles and terminals.
 */
const createNew: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/tree-extension:new',
  description:
    'Plugin to add extra commands to the file browser to create new notebooks, files, consoles and terminals.',
  requires: [IFileBrowserFactory, ITranslator],
  optional: [IToolbarWidgetRegistry],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    fileBrowserFactory: IFileBrowserFactory,
    translator: ITranslator,
    toolbarRegistry: IToolbarWidgetRegistry | null
  ) => {
    const { commands, serviceManager } = app;
    const trans = translator.load('notebook');

    commands.addCommand(CommandIDs.createNewTerminal, {
      label: trans.__('Terminal'),
      icon: terminalIcon,
      isEnabled: () => commands.isEnabled('terminal:create-new'),
      isVisible: () => commands.isVisible('terminal:create-new'),
      execute: () => {
        const browser = fileBrowserFactory.tracker.currentWidget;
        if (browser) {
          return commands.execute('terminal:create-new', {
            cwd: browser.model.path,
          });
        }
      },
      describedBy: {
        args: {
          type: 'object',
          properties: {},
        },
      },
    });

    const overflowOptions = {
      overflowMenuOptions: { isVisible: false },
    };
    const menubar = new MenuBar(overflowOptions);
    const newMenu = new Menu({ commands });
    newMenu.title.label = trans.__('New');
    newMenu.title.icon = caretDownIcon;
    menubar.addMenu(newMenu);

    const populateNewMenu = () => {
      const specs = serviceManager.kernelspecs?.specs?.kernelspecs;
      for (const name in specs) {
        newMenu.addItem({
          args: { kernelName: name, isLauncher: true },
          command: 'notebook:create-new',
        });
      }

      const baseCommands = [
        CommandIDs.createNewTerminal,
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
    const { commands } = app;
    const { selectionChanged } = browser;
    const actions = new FilesActionButtons({
      commands,
      browser,
      selectionChanged,
      translator,
    });
    for (const widget of actions.widgets) {
      toolbarRegistry.addFactory(FILE_BROWSER_FACTORY, widget.id, () => widget);
    }
  },
};

/**
 * A plugin to add the file filter toggle command to the palette.
 */
const fileFilterCommand: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/tree-extension:file-filter-command',
  description: 'A plugin to add file filter command to the palette.',
  autoStart: true,
  requires: [ITranslator],
  optional: [ICommandPalette],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    palette: ICommandPalette | null
  ) => {
    if (palette) {
      const trans = translator.load('notebook');
      palette.addItem({
        command: CommandIDs.toggleFileFilter,
        category: trans.__('File Browser'),
      });
    }
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
 * A plugin to add the file browser widget to an INotebookShell.
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
      (fileBrowser: FileBrowser) =>
        new ProgressUploaderButton(fileBrowser, trans.__('Upload'))
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

    const setCurrentToDefaultBrower = () => {
      tracker['_pool'].current = browser;
    };

    tracker.widgetAdded.connect(() => {
      setCurrentToDefaultBrower();
    });

    setCurrentToDefaultBrower();

    return nbTreeWidget;
  },
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [
  createNew,
  fileActions,
  fileFilterCommand,
  openFileBrowser,
  notebookTreeWidget,
];
export default plugins;
