// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterFrontEnd } from '@jupyterlab/application';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { ArrayExt, find, IIterator, iter } from '@lumino/algorithm';

import { Token } from '@lumino/coreutils';

import { Message, MessageLoop, IMessageHandler } from '@lumino/messaging';

import { ISignal, Signal } from '@lumino/signaling';

import { Panel, Widget, BoxLayout } from '@lumino/widgets';

/**
 * The RetroLab application shell token.
 */
export const IRetroShell = new Token<IRetroShell>(
  '@retrolab/application:IRetroShell'
);

/**
 * The RetroLab application shell interface.
 */
export interface IRetroShell extends RetroShell {}

/**
 * The default rank for ranked panels.
 */
const DEFAULT_RANK = 900;

/**
 * The application shell.
 */
export class RetroShell extends Widget implements JupyterFrontEnd.IShell {
  constructor() {
    super();
    this.id = 'main';

    const rootLayout = new BoxLayout();

    this._topHandler = new Private.PanelHandler();
    this._menuHandler = new Private.PanelHandler();
    this._main = new Panel();

    this._topHandler.panel.id = 'top-panel';
    this._menuHandler.panel.id = 'menu-panel';
    this._main.id = 'main-panel';

    // create wrappers around the top and menu areas
    const topWrapper = (this._topWrapper = new Panel());
    topWrapper.id = 'top-panel-wrapper';
    topWrapper.addWidget(this._topHandler.panel);

    const menuWrapper = (this._menuWrapper = new Panel());
    menuWrapper.id = 'menu-panel-wrapper';
    menuWrapper.addWidget(this._menuHandler.panel);

    BoxLayout.setStretch(topWrapper, 0);
    BoxLayout.setStretch(menuWrapper, 0);
    BoxLayout.setStretch(this._main, 1);

    this._spacer = new Widget();
    this._spacer.id = 'spacer-widget';

    rootLayout.spacing = 0;
    rootLayout.addWidget(topWrapper);
    rootLayout.addWidget(menuWrapper);
    rootLayout.addWidget(this._spacer);
    rootLayout.addWidget(this._main);

    this.layout = rootLayout;
  }

  /**
   * A signal emitted when the current widget changes.
   */
  get currentChanged(): ISignal<RetroShell, void> {
    return this._currentChanged;
  }

  /**
   * The current widget in the shell's main area.
   */
  get currentWidget(): Widget {
    return this._main.widgets[0];
  }

  /**
   * Get the top area wrapper panel
   */
  get top(): Widget {
    return this._topWrapper;
  }

  /**
   * Get the menu area wrapper panel
   */
  get menu(): Widget {
    return this._menuWrapper;
  }

  /**
   * Activate a widget in its area.
   */
  activateById(id: string): void {
    const widget = find(this.widgets('main'), w => w.id === id);
    if (widget) {
      widget.activate();
    }
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
    const rank = options?.rank ?? DEFAULT_RANK;
    if (area === 'top') {
      return this._topHandler.addWidget(widget, rank);
    }
    if (area === 'menu') {
      return this._menuHandler.addWidget(widget, rank);
    }
    if (area === 'main' || area === undefined) {
      if (this._main.widgets.length > 0) {
        // do not add the widget if there is already one
        return;
      }
      this._main.addWidget(widget);
      this._main.update();
      this._currentChanged.emit(void 0);
    }
  }

  /**
   * Collapse the top area and the spacer to make the view more compact.
   */
  collapseTop(): void {
    this._topWrapper.setHidden(true);
    this._spacer.setHidden(true);
  }

  /**
   * Expand the top area to show the header and the spacer.
   */
  expandTop(): void {
    this._topWrapper.setHidden(false);
    this._spacer.setHidden(false);
  }

  /**
   * Return the list of widgets for the given area.
   *
   * @param area The area
   */
  widgets(area: Shell.Area): IIterator<Widget> {
    switch (area ?? 'main') {
      case 'top':
        return iter(this._topHandler.panel.widgets);
      case 'menu':
        return iter(this._menuHandler.panel.widgets);
      case 'main':
        return iter(this._main.widgets);
      default:
        throw new Error(`Invalid area: ${area}`);
    }
  }

  private _topWrapper: Panel;
  private _topHandler: Private.PanelHandler;
  private _menuWrapper: Panel;
  private _menuHandler: Private.PanelHandler;
  private _spacer: Widget;
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
