// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { PageConfig, PathExt, URLExt } from '@jupyterlab/coreutils';

import {
  IDocumentWidgetOpener,
  IRecentsManager,
  RecentDocument,
} from '@jupyterlab/docmanager';

import { IDocumentWidget, DocumentRegistry } from '@jupyterlab/docregistry';

import { Contents, ServerConnection } from '@jupyterlab/services';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { ITranslator, nullTranslator } from '@jupyterlab/translation';

import {
  INotebookPathOpener,
  INotebookShell,
  defaultNotebookPathOpener,
} from '@jupyter-notebook/application';

import { ISignal, Signal } from '@lumino/signaling';

/**
 * A plugin to open documents in a new browser tab.
 *
 */
const opener: JupyterFrontEndPlugin<IDocumentWidgetOpener> = {
  id: '@jupyter-notebook/docmanager-extension:opener',
  autoStart: true,
  optional: [INotebookPathOpener, INotebookShell],
  provides: IDocumentWidgetOpener,
  description: 'Open documents in a new browser tab',
  activate: (
    app: JupyterFrontEnd,
    notebookPathOpener: INotebookPathOpener | null,
    notebookShell: INotebookShell | null
  ) => {
    const baseUrl = PageConfig.getBaseUrl();
    const docRegistry = app.docRegistry;
    const pathOpener = notebookPathOpener ?? defaultNotebookPathOpener;
    let id = 0;
    return new (class {
      async open(
        widget: IDocumentWidget,
        options?: DocumentRegistry.IOpenOptions
      ) {
        const widgetName = options?.type ?? '';
        const ref = options?.ref;
        // check if there is an setting override and if it would add the widget in the main area
        const userLayoutArea = notebookShell?.userLayout?.[widgetName]?.area;

        if (ref !== '_noref' && userLayoutArea === undefined) {
          const path = widget.context.path;
          const ext = PathExt.extname(path);
          let route = 'edit';
          if (
            (widgetName === 'default' && ext === '.ipynb') ||
            widgetName.includes('Notebook')
          ) {
            // make sure to save the notebook before opening it in a new tab
            // so the kernel info is saved (if created from the New dropdown)
            if (widget.context.sessionContext.kernelPreference.name) {
              await widget.context.save();
            }
            route = 'notebooks';
          }
          // append ?factory only if it's not the default
          const defaultFactory = docRegistry.defaultWidgetFactory(path);
          let searchParams = undefined;
          if (widgetName !== defaultFactory.name) {
            searchParams = new URLSearchParams({
              factory: widgetName,
            });
          }

          pathOpener.open({
            prefix: URLExt.join(baseUrl, route),
            path,
            searchParams,
          });

          // dispose the widget since it is not used on this page, unless it
          // is attached, i.e. it is the document currently being displayed
          // (for example when reopening it from the "Open Recent" menu)
          if (!widget.isAttached) {
            widget.dispose();
          }
          return;
        }

        // otherwise open the document on the current page

        if (!widget.id) {
          widget.id = `document-manager-${++id}`;
        }
        widget.title.dataset = {
          type: 'document-title',
          ...widget.title.dataset,
        };
        if (!widget.isAttached) {
          app.shell.add(widget, 'main', options || {});
        }
        app.shell.activateById(widget.id);
        this._opened.emit(widget);
      }

      get opened() {
        return this._opened;
      }

      private _opened = new Signal<this, IDocumentWidget>(this);
    })();
  },
};

/**
 * The key used to persist the recent documents in the browser local storage.
 *
 * Using the local storage (rather than the application state database) allows
 * the list to be shared across the separate Notebook pages (tree, notebooks,
 * edit, ...). Each page reads the shared list on demand, so returning to the
 * tree page (or switching to the Recents tab) always reflects what the other
 * pages have recorded.
 */
const RECENTS_STORAGE_KEY = '@jupyter-notebook/docmanager:recents';

/**
 * A manager for recently opened and closed documents.
 *
 * Unlike JupyterLab's `RecentsManager`, the list is persisted in the browser
 * local storage rather than the application state database. This is required
 * because the Notebook application uses a separate page (and a fresh in-memory
 * state database) for each document, so the recent documents need a shared,
 * persistent store to be visible from the tree page. The list is read from the
 * local storage on demand, so switching to the Recents tab (or returning to an
 * already-open tree page) always reflects what the other pages have recorded,
 * without a reload.
 */
class NotebookRecentsManager implements IRecentsManager {
  constructor(options: NotebookRecentsManager.IOptions) {
    this._contents = options.contents;
    this._serverRoot = PageConfig.getOption('serverRoot');
    this._lastSeen = Private.loadRaw();
    // When the page becomes visible or regains focus, notify listeners if
    // another page changed the shared list, so an already-open page (e.g. the
    // tree view) refreshes without a reload.
    document.addEventListener('visibilitychange', this._onVisibilityChange);
    window.addEventListener('focus', this._onFocus);
  }

  /**
   * Whether the manager is disposed or not.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Signal emitted when the recent list changes.
   */
  get changed(): ISignal<IRecentsManager, void> {
    return this._changed;
  }

  /**
   * The list of recently opened documents for the current server root.
   *
   * The list is read from the local storage on each access so that changes
   * made on another page are reflected without a reload.
   */
  get recentlyOpened(): RecentDocument[] {
    return Private.loadRecents().opened.filter(
      (r) => r.root === this._serverRoot
    );
  }

  /**
   * The list of recently closed documents for the current server root.
   *
   * The list is read from the local storage on each access so that changes
   * made on another page are reflected without a reload.
   */
  get recentlyClosed(): RecentDocument[] {
    return Private.loadRecents().closed.filter(
      (r) => r.root === this._serverRoot
    );
  }

  /**
   * The maximal number of recent items to keep per list.
   */
  get maximalRecentsLength(): number {
    return this._maxRecentsLength;
  }
  set maximalRecentsLength(value: number) {
    this._maxRecentsLength = Math.round(Math.max(1, value));
    const recents = Private.loadRecents();
    let changed = false;
    for (const type of ['opened', 'closed'] as const) {
      if (recents[type].length > this._maxRecentsLength) {
        recents[type] = recents[type].slice(0, this._maxRecentsLength);
        changed = true;
      }
    }
    if (changed) {
      this._save(recents);
      this._changed.emit(undefined);
    }
  }

  /**
   * Add a new document to the recent list.
   *
   * The document is stamped with the current time, so the tree page can show
   * when it was last opened.
   */
  addRecent(
    document: Omit<RecentDocument, 'root'>,
    event: 'opened' | 'closed'
  ): void {
    // Read the shared list first so concurrent changes from other pages are
    // not lost.
    const recents = Private.loadRecents();
    const recent: Private.StampedRecentDocument = {
      ...document,
      root: this._serverRoot,
      lastOpened: Date.now(),
    };
    const list = recents[event];
    const existing = list.findIndex((r) => r.path === document.path);
    if (existing >= 0) {
      list.splice(existing, 1);
    }
    list.unshift(recent);
    recents[event] = list.slice(0, this._maxRecentsLength);
    this._save(recents);
    this._changed.emit(undefined);
  }

  /**
   * Remove a document from the recent list.
   */
  removeRecent(document: RecentDocument, event: 'opened' | 'closed'): void {
    this._removeRecent(document.path, [event]);
  }

  /**
   * Clear the recent list.
   */
  clearRecents(): void {
    this._save({ opened: [], closed: [] });
    this._changed.emit(undefined);
  }

  /**
   * Check if a recent document still exists, removing it from the list if not.
   */
  async validate(recent: RecentDocument): Promise<boolean> {
    const valid = await this._isValid(recent);
    if (!valid) {
      this._removeRecent(recent.path, ['opened', 'closed']);
    }
    return valid;
  }

  /**
   * Dispose the manager resources.
   */
  dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    document.removeEventListener('visibilitychange', this._onVisibilityChange);
    window.removeEventListener('focus', this._onFocus);
    Signal.clearData(this);
  }

  /**
   * Remove a path from the given lists and persist the change.
   */
  private _removeRecent(path: string, events: ('opened' | 'closed')[]): void {
    // Read the shared list first so concurrent changes from other pages are
    // not lost.
    const recents = Private.loadRecents();
    let changed = false;
    for (const event of events) {
      const list = recents[event];
      const next = list.filter((r) => r.path !== path);
      if (next.length !== list.length) {
        recents[event] = next;
        changed = true;
      }
    }
    if (changed) {
      this._save(recents);
      this._changed.emit(undefined);
    }
  }

  /**
   * Check whether the path of a recent document still exists on the server.
   */
  private async _isValid(recent: RecentDocument): Promise<boolean> {
    try {
      await this._contents.get(recent.path, { content: false });
    } catch (e) {
      if ((e as ServerConnection.ResponseError).response?.status === 404) {
        return false;
      }
    }
    return true;
  }

  /**
   * Persist the given list to the local storage, tracking the serialized value
   * so the manager can tell its own writes apart from another page's.
   */
  private _save(recents: Private.RecentsDatabase): void {
    this._lastSeen = Private.saveRecents(recents);
  }

  /**
   * Refresh when the page becomes visible again.
   */
  private _onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this._refresh();
    }
  };

  /**
   * Refresh when the window regains focus.
   */
  private _onFocus = (): void => {
    this._refresh();
  };

  /**
   * Emit `changed` if another page has changed the shared list since it was
   * last read or written here, so a visible panel re-renders with the
   * up-to-date list.
   */
  private _refresh(): void {
    const raw = Private.loadRaw();
    if (raw !== this._lastSeen) {
      this._lastSeen = raw;
      this._changed.emit(undefined);
    }
  }

  private _contents: Contents.IManager;
  private _serverRoot: string;
  private _maxRecentsLength = 10;
  private _isDisposed = false;
  private _lastSeen: string;
  private _changed = new Signal<this, void>(this);
}

/**
 * A namespace for `NotebookRecentsManager` options.
 */
namespace NotebookRecentsManager {
  /**
   * Initialization options for `NotebookRecentsManager`.
   */
  export interface IOptions {
    /**
     * The contents manager used to validate the recent documents.
     */
    contents: Contents.IManager;
  }
}

/**
 * A namespace for private module data.
 */
namespace Private {
  /**
   * A recent document stamped with the time it was recorded, so the tree page
   * can show when a document was last opened.
   */
  export type StampedRecentDocument = RecentDocument & {
    /**
     * The time the document was recorded, in milliseconds since the epoch.
     */
    lastOpened?: number;
  };

  /**
   * The structure persisted in the local storage.
   */
  export type RecentsDatabase = {
    opened: StampedRecentDocument[];
    closed: StampedRecentDocument[];
  };

  /**
   * Load the raw (serialized) recent documents from the local storage.
   *
   * Returns an empty string when there is nothing stored, so it can be compared
   * to detect changes made by another page.
   */
  export function loadRaw(): string {
    try {
      return localStorage.getItem(RECENTS_STORAGE_KEY) ?? '';
    } catch (error) {
      console.warn('Failed to load the recent documents', error);
      return '';
    }
  }

  /**
   * The last raw value loaded from the local storage, and its parsed form.
   *
   * Reusing the parsed value until the raw value changes keeps the identity
   * of the recent documents stable across accesses, which the "Open Recent"
   * menu relies on to enable its items, and avoids parsing the list again on
   * every render.
   */
  let lastRaw = '';
  let lastRecents: RecentsDatabase = { opened: [], closed: [] };

  /**
   * Load the recent documents from the local storage.
   */
  export function loadRecents(): RecentsDatabase {
    const raw = loadRaw();
    if (raw === lastRaw) {
      return lastRecents;
    }
    let recents: RecentsDatabase = { opened: [], closed: [] };
    if (raw) {
      try {
        const data = JSON.parse(raw);
        recents = {
          opened: Array.isArray(data.opened) ? data.opened : [],
          closed: Array.isArray(data.closed) ? data.closed : [],
        };
      } catch (error) {
        console.warn('Failed to parse the recent documents', error);
      }
    }
    lastRaw = raw;
    lastRecents = recents;
    return recents;
  }

  /**
   * Save the recent documents to the local storage, returning the serialized
   * value that was stored.
   */
  export function saveRecents(recents: RecentsDatabase): string {
    const raw = JSON.stringify(recents);
    try {
      localStorage.setItem(RECENTS_STORAGE_KEY, raw);
    } catch (error) {
      console.warn('Failed to save the recent documents', error);
    }
    lastRaw = raw;
    lastRecents = recents;
    return raw;
  }
}

/**
 * A plugin providing a recent documents manager.
 *
 * Unlike JupyterLab's `@jupyterlab/docmanager-extension:recents` plugin, the
 * recent documents are persisted in the browser local storage rather than the
 * application state database. This is required because the Notebook
 * application uses a separate page (and a fresh in-memory state database) for
 * each document, so the list of recently opened documents needs a shared,
 * persistent store to be visible from the tree page.
 */
const recents: JupyterFrontEndPlugin<IRecentsManager> = {
  id: '@jupyter-notebook/docmanager-extension:recents',
  description:
    'Provides a manager of recently opened and closed documents, persisted across pages in the browser local storage.',
  autoStart: true,
  provides: IRecentsManager,
  optional: [ISettingRegistry, ITranslator],
  activate: (
    app: JupyterFrontEnd,
    settingRegistry: ISettingRegistry | null,
    translator: ITranslator | null
  ): IRecentsManager => {
    const { commands, serviceManager } = app;
    const trans = (translator ?? nullTranslator).load('notebook');

    const recentsManager = new NotebookRecentsManager({
      contents: serviceManager.contents,
    });

    // Keep the maximal number of recents in sync with the document manager
    // settings, matching the behavior of the JupyterLab recents plugin.
    const updateSettings = (settings: ISettingRegistry.ISettings) => {
      recentsManager.maximalRecentsLength = settings.get('maxNumberRecents')
        .composite as number;
    };

    if (settingRegistry) {
      // Wait for the application to be restored before loading the settings,
      // so the load does not race the settings of the other plugins still
      // being registered during startup.
      void app.restored
        .then(() =>
          settingRegistry.load('@jupyterlab/docmanager-extension:plugin')
        )
        .then((settings) => {
          settings.changed.connect(updateSettings);
          updateSettings(settings);
        })
        .catch((reason) => {
          console.warn(
            'Failed to load the document manager settings for recents',
            reason
          );
        });
    }

    commands.addCommand('docmanager:clear-recents', {
      execute: () => {
        recentsManager.clearRecents();
      },
      isEnabled: () =>
        recentsManager.recentlyOpened.length !== 0 ||
        recentsManager.recentlyClosed.length !== 0,
      label: trans.__('Clear Recent Documents'),
      caption: trans.__('Clear the list of recently opened items.'),
      describedBy: {
        args: {
          type: 'object',
          properties: {},
        },
      },
    });

    return recentsManager;
  },
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [opener, recents];

export default plugins;
