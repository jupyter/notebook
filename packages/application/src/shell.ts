// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterFrontEnd } from '@jupyterlab/application';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { ArrayExt, IIterator, iter } from '@lumino/algorithm';
import { Token } from '@lumino/coreutils';

import { Message, MessageLoop, IMessageHandler } from '@lumino/messaging';

import { ISignal, Signal } from '@lumino/signaling';

import { Panel, Widget, BoxLayout } from '@lumino/widgets';

/**
 * The JupyterLab Classic application shell token.
 */
export const IClassicShell = new Token<IClassicShell>(
  '@jupyterlab-classic/application:IClassicShell'
);

/**
 * The JupyterLab Classic application shell interface.
 */
export interface IClassicShell extends ClassicShell {}

/**
 * The default rank for ranked panels.
 */
const DEFAULT_RANK = 900;

/**
 * The application shell.
 */
export class ClassicShell extends Widget implements JupyterFrontEnd.IShell {
  constructor() {
    super();
    this.id = 'main';

    const rootLayout = new BoxLayout();

    this._topHandler = new Private.PanelHandler();
    this._menu = new Panel();
    this._main = new Panel();

    this._topHandler.panel.id = 'top-panel';
    this._menu.id = 'menu-panel';
    this._main.id = 'main-panel';

    BoxLayout.setStretch(this._topHandler.panel, 0);
    BoxLayout.setStretch(this._menu, 0);
    BoxLayout.setStretch(this._main, 1);

    const spacer = new Widget();
    spacer.node.style.minHeight = '16px';

    rootLayout.spacing = 0;
    rootLayout.addWidget(this._topHandler.panel);
    rootLayout.addWidget(this._menu);
    rootLayout.addWidget(spacer);
    rootLayout.addWidget(this._main);

    this.layout = rootLayout;
  }

  activateById(id: string): void {
    // no-op
  }

  /**
   * Add a widget to the application shell.
   *
   * @param widget - The widget being added.
   *
   * @param area - Optional region in the shell into which the widget should
   * be added.
   *
   * @param options - Optional open options.
   *
   */
  add(
    widget: Widget,
    area?: Shell.Area,
    options?: DocumentRegistry.IOpenOptions
  ): void {
    if (area === 'top') {
      const rank = options?.rank ?? DEFAULT_RANK;
      return this._topHandler.addWidget(widget, rank);
    }
    if (area === 'menu') {
      return this._menu.addWidget(widget);
    }
    this._main.widgets.forEach(w => {
      w.close();
    });
    this._main.addWidget(widget);
    this._main.update();
    this._currentChanged.emit(void 0);
  }

  /**
   * A signal emitted when the current widget changes.
   */
  get currentChanged(): ISignal<ClassicShell, void> {
    return this._currentChanged;
  }

  /**
   * The current widget in the shell's main area.
   */
  get currentWidget(): Widget {
    return this._main.widgets[0];
  }

  /**
   * Return the list of widgets for the given area.
   *
   * @param area The area
   */
  widgets(area: Shell.Area): IIterator<Widget> {
    if (area === 'top') {
      return iter(this._topHandler.panel.widgets);
    }
    if (area === 'menu') {
      return iter(this._menu.widgets);
    }
    return iter(this._main.widgets);
  }

  private _topHandler: Private.PanelHandler;
  private _menu: Panel;
  private _main: Panel;
  private _currentChanged = new Signal<this, void>(this);
}

/**
 * A namespace for Shell statics
 */
export namespace Shell {
  /**
   * The areas of the application shell where widgets can reside.
   */
  export type Area = 'main' | 'top' | 'menu';
}

/**
 * A namespace for private module data.
 */
namespace Private {
  /**
   * An object which holds a widget and its sort rank.
   */
  export interface IRankItem {
    /**
     * The widget for the item.
     */
    widget: Widget;

    /**
     * The sort rank of the widget.
     */
    rank: number;
  }
  /**
   * A less-than comparison function for side bar rank items.
   */
  export function itemCmp(first: IRankItem, second: IRankItem): number {
    return first.rank - second.rank;
  }

  /**
   * A class which manages a panel and sorts its widgets by rank.
   */
  export class PanelHandler {
    constructor() {
      MessageLoop.installMessageHook(this._panel, this._panelChildHook);
    }

    /**
     * Get the panel managed by the handler.
     */
    get panel(): Panel {
      return this._panel;
    }

    /**
     * Add a widget to the panel.
     *
     * If the widget is already added, it will be moved.
     */
    addWidget(widget: Widget, rank: number): void {
      widget.parent = null;
      const item = { widget, rank };
      const index = ArrayExt.upperBound(this._items, item, Private.itemCmp);
      ArrayExt.insert(this._items, index, item);
      this._panel.insertWidget(index, widget);
    }

    /**
     * A message hook for child add/remove messages on the main area dock panel.
     */
    private _panelChildHook = (
      handler: IMessageHandler,
      msg: Message
    ): boolean => {
      switch (msg.type) {
        case 'child-added':
          {
            const widget = (msg as Widget.ChildMessage).child;
            // If we already know about this widget, we're done
            if (this._items.find(v => v.widget === widget)) {
              break;
            }

            // Otherwise, add to the end by default
            const rank = this._items[this._items.length - 1].rank;
            this._items.push({ widget, rank });
          }
          break;
        case 'child-removed':
          {
            const widget = (msg as Widget.ChildMessage).child;
            ArrayExt.removeFirstWhere(this._items, v => v.widget === widget);
          }
          break;
        default:
          break;
      }
      return true;
    };

    private _items = new Array<Private.IRankItem>();
    private _panel = new Panel();
  }
}
