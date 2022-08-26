// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterFrontEnd } from '@jupyterlab/application';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { closeIcon, LabIcon, ReactWidget } from '@jupyterlab/ui-components';

import { ArrayExt, find } from '@lumino/algorithm';
import { PromiseDelegate, Token } from '@lumino/coreutils';
import { IDisposable } from '@lumino/disposable';
import { Message, MessageLoop, IMessageHandler } from '@lumino/messaging';
import { Debouncer } from '@lumino/polling';
import { ISignal, Signal } from '@lumino/signaling';

import {
  BoxLayout,
  Panel,
  SplitPanel,
  StackedPanel,
  Widget
} from '@lumino/widgets';
import React from 'react';

/**
 * The Jupyter Notebook application shell token.
 */
export const INotebookShell = new Token<INotebookShell>(
  '@jupyter-notebook/application:INotebookShell'
);

/**
 * The Jupyter Notebook application shell interface.
 */
export interface INotebookShell extends NotebookShell {}

/**
 * The default rank for ranked panels.
 */
const DEFAULT_RANK = 900;

/**
 * The application shell.
 */
export class NotebookShell extends Widget implements JupyterFrontEnd.IShell {
  constructor() {
    super();
    this.id = 'main';

    this._topHandler = new Private.PanelHandler();
    this._menuHandler = new Private.PanelHandler();
    this._leftHandler = new Private.SideBarHandler('left');
    this._rightHandler = new Private.SideBarHandler('right');
    this._main = new Panel();
    const topWrapper = (this._topWrapper = new Panel());
    const menuWrapper = (this._menuWrapper = new Panel());

    this._topHandler.panel.id = 'top-panel';
    this._menuHandler.panel.id = 'menu-panel';
    this._main.id = 'main-panel';

    this._spacer = new Widget();
    this._spacer.id = 'spacer-widget';

    // create wrappers around the top and menu areas
    topWrapper.id = 'top-panel-wrapper';
    topWrapper.addWidget(this._topHandler.panel);

    menuWrapper.id = 'menu-panel-wrapper';
    menuWrapper.addWidget(this._menuHandler.panel);

    const rootLayout = new BoxLayout();
    const leftHandler = this._leftHandler;
    const rightHandler = this._rightHandler;

    this.leftPanel.id = 'jp-left-stack';
    this.rightPanel.id = 'jp-right-stack';

    // Hide the side panels by default.
    leftHandler.hide();
    rightHandler.hide();

    // Catch current changed events on the side handlers.
    leftHandler.updated.connect(this._onLayoutModified, this);
    rightHandler.updated.connect(this._onLayoutModified, this);

    const middleLayout = new BoxLayout({
      spacing: 0,
      direction: 'top-to-bottom'
    });
    BoxLayout.setStretch(this._topWrapper, 0);
    BoxLayout.setStretch(this._menuWrapper, 0);
    BoxLayout.setStretch(this._main, 1);

    const middlePanel = new Panel({ layout: middleLayout });
    middlePanel.addWidget(this._topWrapper);
    middlePanel.addWidget(this._menuWrapper);
    middlePanel.addWidget(this._spacer);
    middlePanel.addWidget(this._main);
    middlePanel.layout = middleLayout;

    // TODO: Consider storing this as an attribute this._hsplitPanel if saving/restoring layout needed
    const hsplitPanel = new SplitPanel();
    hsplitPanel.id = 'main-split-panel';
    hsplitPanel.spacing = 1;
    BoxLayout.setStretch(hsplitPanel, 1);

    SplitPanel.setStretch(leftHandler.panel, 0);
    SplitPanel.setStretch(rightHandler.panel, 0);
    SplitPanel.setStretch(middlePanel, 1);

    hsplitPanel.addWidget(leftHandler.panel);
    hsplitPanel.addWidget(middlePanel);
    hsplitPanel.addWidget(rightHandler.panel);

    // Use relative sizing to set the width of the side panels.
    // This will still respect the min-size of children widget in the stacked
    // panel.
    hsplitPanel.setRelativeSizes([1, 2.5, 1]);

    rootLayout.spacing = 0;
    rootLayout.addWidget(hsplitPanel);

    this.layout = rootLayout;
  }

  /**
   * A signal emitted when the current widget changes.
   */
  get currentChanged(): ISignal<NotebookShell, void> {
    return this._currentChanged;
  }

  /**
   * The current widget in the shell's main area.
   */
  get currentWidget(): Widget | null {
    return this._main.widgets[0] ?? null;
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
   * Get the left area handler
   */
  get leftHandler(): Private.SideBarHandler {
    return this._leftHandler;
  }

  /**
   * Get the right area handler
   */
  get rightHandler(): Private.SideBarHandler {
    return this._rightHandler;
  }

  /**
   * Shortcut to get the left area handler's stacked panel
   */
  get leftPanel(): Panel {
    return this._leftHandler.panel;
  }

  /**
   * Shortcut to get the right area handler's stacked panel
   */
  get rightPanel(): Panel {
    return this._rightHandler.panel;
  }

  /**
   * Is the left sidebar visible?
   */
  get leftCollapsed(): boolean {
    return !(this._leftHandler.isVisible && this.leftPanel.isVisible);
  }

  /**
   * Is the right sidebar visible?
   */
  get rightCollapsed(): boolean {
    return !(this._rightHandler.isVisible && this.rightPanel.isVisible);
  }

  /**
   * Promise that resolves when main widget is loaded
   */
  get restored(): Promise<void> {
    return this._mainWidgetLoaded.promise;
  }

  /**
   * Activate a widget in its area.
   */
  activateById(id: string): void {
    // Search all areas that can have widgets for this widget, starting with main.
    for (const area of ['main', 'top', 'left', 'right', 'menu']) {
      const widget = find(this.widgets(area), w => w.id === id);
      if (widget) {
        if (area === 'left') {
          this.expandLeft(id);
        } else if (area === 'right') {
          this.expandRight(id);
        } else {
          widget.activate();
        }
      }
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
    area?: string,
    options?: DocumentRegistry.IOpenOptions
  ): void {
    const rank = options?.rank ?? DEFAULT_RANK;
    switch (area) {
      case 'top':
        return this._topHandler.addWidget(widget, rank);
      case 'menu':
        return this._menuHandler.addWidget(widget, rank);
      case 'main':
      case undefined:
        if (this._main.widgets.length > 0) {
          // do not add the widget if there is already one
          return;
        }
        this._main.addWidget(widget);
        this._main.update();
        this._currentChanged.emit(void 0);
        this._mainWidgetLoaded.resolve();
        break;
      case 'left':
        return this._leftHandler.addWidget(widget, rank);
      case 'right':
        return this._rightHandler.addWidget(widget, rank);
      default:
        console.warn(`Cannot add widget to area: ${area}`);
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
  *widgets(area: Shell.Area): IterableIterator<Widget> {
    switch (area ?? 'main') {
      case 'top':
        yield* this._topHandler.panel.widgets;
        return;
      case 'menu':
        yield* this._menuHandler.panel.widgets;
        return;
      case 'main':
        yield* this._main.widgets;
        return;
    }
  }

  /**
   * Expand the left panel to show the sidebar with its widget.
   */
  expandLeft(id?: string): void {
    this.leftPanel.show();
    this._leftHandler.expand(id); // Show the current widget, if any
    this._onLayoutModified();
  }

  /**
   * Collapse the left panel
   */
  collapseLeft(): void {
    this._leftHandler.collapse();
    this.leftPanel.hide();
    this._onLayoutModified();
  }

  /**
   * Expand the right panel to show the sidebar with its widget.
   */
  expandRight(id?: string): void {
    this.rightPanel.show();
    this._rightHandler.expand(id); // Show the current widget, if any
    this._onLayoutModified();
  }

  /**
   * Collapse the right panel
   */
  collapseRight(): void {
    this._rightHandler.collapse();
    this.rightPanel.hide();
    this._onLayoutModified();
  }

  widgetsList(area?: string): readonly Widget[] {
    switch (area ?? 'main') {
      case 'top':
        return this._topHandler.panel.widgets;
      case 'menu':
        return this._menuHandler.panel.widgets;
      case 'main':
        return this._main.widgets;
      case 'left':
        return this._leftHandler.widgets;
      case 'right':
        return this._rightHandler.widgets;
      default:
        console.error(`This shell has no area called "${area}"`);
        return;
    }
  }

  /**
   * Is a particular area empty (no widgets)?
   *
   * @param area Named area in the application
   * @returns true if area has no widgets, false if at least one widget is present
   */
  isEmpty(area: Shell.Area): boolean {
    return this.widgetsList(area).length === 0;
  }

  /**
   * Handle a change to the layout.
   */
  private _onLayoutModified(): void {
    void this._layoutDebouncer.invoke();
  }

  private _layoutModified = new Signal<this, void>(this);
  private _layoutDebouncer = new Debouncer(() => {
    this._layoutModified.emit(undefined);
  }, 0);
  private _topWrapper: Panel;
  private _topHandler: Private.PanelHandler;
  private _menuWrapper: Panel;
  private _menuHandler: Private.PanelHandler;
  private _leftHandler: Private.SideBarHandler;
  private _rightHandler: Private.SideBarHandler;
  private _spacer: Widget;
  private _main: Panel;
  private _currentChanged = new Signal<this, void>(this);
  private _mainWidgetLoaded = new PromiseDelegate<void>();
}

/**
 * A namespace for Shell statics
 */
export namespace Shell {
  /**
   * The areas of the application shell where widgets can reside.
   */
  export type Area = 'main' | 'top' | 'left' | 'right' | 'menu';
}

/**
 * A name space for SidebarPanel functions.
 */
export namespace SideBarPanel {
  /**
   * The function to update the sidebar menu.
   */
  export type UpdateSideBarMenuFn = (
    area: 'left' | 'right',
    entryLabel: string
  ) => IDisposable | null;

  /**
   * The function to add an item to the palette.
   */
  export type AddPaletteEntryFn = (
    widget: Readonly<Widget>,
    area: 'left' | 'right'
  ) => void;

  /**
   * The function to remove an item from the palette.
   */
  export type RemovePaletteEntryFn = (
    widget: Readonly<Widget>,
    area: 'left' | 'right'
  ) => void;
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

  /**
   * A class which manages a side bar that can show at most one widget at a time.
   */
  export class SideBarHandler {
    /**
     * Construct a new side bar handler.
     */
    constructor(area: 'left' | 'right') {
      this._area = area;
      this._panel = new Panel();
      this._panel.hide();

      this._current = null;
      this._lastCurrent = null;
      this._menuEntryLabel = `${area[0].toUpperCase()}${area.slice(1)} Sidebar`;

      this._widgetPanel = new StackedPanel();
      this._widgetPanel.widgetRemoved.connect(this._onWidgetRemoved, this);

      const that = this;
      const collapseIcon = React.createElement(
        'div',
        {
          onClick: () => {
            that.collapse();
            that.hide();
          }
        },
        LabIcon.resolveReact({
          icon: closeIcon,
          className: 'jp-SidePanel-collapse'
        })
      );

      this._panel.addWidget(ReactWidget.create(collapseIcon));
      this._panel.addWidget(this._widgetPanel);
    }

    get current(): Widget | null {
      return (
        this._current ||
        this._lastCurrent ||
        (this._items.length > 0 ? this._items[0].widget : null)
      );
    }

    /**
     * Whether the panel is visible
     */
    get isVisible(): boolean {
      return this._panel.isVisible;
    }

    /**
     * Get the stacked panel managed by the handler
     */
    get panel(): Panel {
      return this._panel;
    }

    /**
     * Get the widgets list.
     */
    get widgets(): Readonly<Widget[]> {
      return this._items.map(obj => obj.widget);
    }

    /**
     * Signal fires when the stacked panel changes
     */
    get updated(): ISignal<SideBarHandler, void> {
      return this._updated;
    }

    /**
     * Add a function to update the menus with the side bar widgets.
     * @param updateMenu - the function to call to update the menu.
     */
    addUpdateMenuFn(updateMenu: SideBarPanel.UpdateSideBarMenuFn): void {
      this._updateMenu = updateMenu;
      this.updateMenu();
    }

    /**
     * Add functions to add or remove entry in CommandPalette.
     */
    addPaletteFn(
      addEntry: SideBarPanel.AddPaletteEntryFn,
      removeEntry: SideBarPanel.RemovePaletteEntryFn
    ): void {
      this._addPaletteEntry = addEntry;
      this._removePaletteEntry = removeEntry;

      this._widgetPanel.widgets.forEach(widget => {
        if (this._addPaletteEntry != null) {
          this._addPaletteEntry(widget, this._area);
        }
      });
    }

    /**
     * Expand the sidebar.
     *
     * #### Notes
     * This will open the most recently used widget, or the first widget
     * if there is no most recently used.
     */
    expand(id?: string): void {
      if (this._current) {
        this.collapse();
      }
      if (id) {
        this.activate(id);
      } else {
        const visibleWidget = this.current;
        if (visibleWidget) {
          this._current = visibleWidget;
          this.activate(visibleWidget.id);
        }
      }
    }

    /**
     * Activate a widget residing in the stacked panel by ID.
     *
     * @param id - The widget's unique ID.
     */
    activate(id: string): void {
      const widget = this._findWidgetByID(id);
      if (widget) {
        this._current = widget;
        widget.show();
        widget.activate();
      }
    }

    /**
     * Test whether the sidebar has the given widget by id.
     */
    has(id: string): boolean {
      return this._findWidgetByID(id) !== null;
    }

    /**
     * Collapse the sidebar so no items are expanded.
     */
    collapse(): void {
      this._current?.hide();
      this._current = null;
    }

    /**
     * Add a widget and its title to the stacked panel.
     *
     * If the widget is already added, it will be moved.
     */
    addWidget(widget: Widget, rank: number): void {
      widget.parent = null;
      widget.hide();
      const item = { widget, rank };
      const index = this._findInsertIndex(item);
      ArrayExt.insert(this._items, index, item);
      this._widgetPanel.insertWidget(index, widget);
      this.updateMenu();
      this._refreshVisibility();

      if (this._addPaletteEntry) {
        this._addPaletteEntry(widget, this._area);
      }
    }

    /**
     * Hide the side panel
     */
    hide(): void {
      this._isHiddenByUser = true;
      this._refreshVisibility();
    }

    /**
     * Show the side panel
     */
    show(): void {
      this._isHiddenByUser = false;
      this._refreshVisibility();
    }

    /**
     * Update menu entries
     */
    updateMenu(): void {
      if (!this._updateMenu) {
        return;
      }
      if (this._disposableMenu) {
        this._disposableMenu.dispose();
      }
      this._disposableMenu = this._updateMenu(this._area, this._menuEntryLabel);
    }

    /**
     * Find the insertion index for a rank item.
     */
    private _findInsertIndex(item: Private.IRankItem): number {
      return ArrayExt.upperBound(this._items, item, Private.itemCmp);
    }

    /**
     * Find the index of the item with the given widget, or `-1`.
     */
    private _findWidgetIndex(widget: Widget): number {
      return ArrayExt.findFirstIndex(this._items, i => i.widget === widget);
    }

    /**
     * Find the widget with the given id, or `null`.
     */
    private _findWidgetByID(id: string): Widget | null {
      const item = find(this._items, value => value.widget.id === id);
      return item ? item.widget : null;
    }

    /**
     * Refresh the visibility of the stacked panel.
     */
    private _refreshVisibility(): void {
      this._panel.setHidden(this._isHiddenByUser);
      this._updated.emit();
    }

    /*
     * Handle the `widgetRemoved` signal from the panel.
     */
    private _onWidgetRemoved(sender: StackedPanel, widget: Widget): void {
      if (widget === this._lastCurrent) {
        this._lastCurrent = null;
      }
      ArrayExt.removeAt(this._items, this._findWidgetIndex(widget));

      this.updateMenu();
      this._refreshVisibility();

      if (this._removePaletteEntry) {
        this._removePaletteEntry(widget, this._area);
      }
    }

    private _area: 'left' | 'right';
    private _isHiddenByUser = false;
    private _items = new Array<Private.IRankItem>();
    private _panel: Panel;
    private _widgetPanel: StackedPanel;
    private _current: Widget | null;
    private _lastCurrent: Widget | null;
    private _updated: Signal<SideBarHandler, void> = new Signal(this);
    private _menuEntryLabel: string;
    private _disposableMenu: IDisposable | null = null;
    private _updateMenu: SideBarPanel.UpdateSideBarMenuFn | null = null;
    private _addPaletteEntry: SideBarPanel.AddPaletteEntryFn | null = null;
    private _removePaletteEntry: SideBarPanel.RemovePaletteEntryFn | null = null;
  }
}
