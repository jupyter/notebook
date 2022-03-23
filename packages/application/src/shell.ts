// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterFrontEnd } from '@jupyterlab/application';
import { PageConfig } from '@jupyterlab/coreutils';
import { DocumentRegistry } from '@jupyterlab/docregistry';

import { ArrayExt, find } from '@lumino/algorithm';
import { Token } from '@lumino/coreutils';
import { Message, MessageLoop, IMessageHandler } from '@lumino/messaging';
import { Debouncer } from '@lumino/polling';
import { ISignal, Signal } from '@lumino/signaling';

import {
  BoxLayout,
  Layout,
  Panel,
  SplitPanel,
  StackedPanel,
  Widget
} from '@lumino/widgets';

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
    this._leftHandler = new Private.SideBarHandler();
    this._rightHandler = new Private.SideBarHandler();
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

    BoxLayout.setStretch(this._topWrapper, 0);
    BoxLayout.setStretch(this._menuWrapper, 0);

    if (this.sidePanelsVisible()) {
      this.layout = this.initLayoutWithSidePanels();
    } else {
      this.layout = this.initLayoutWithoutSidePanels();
    }
  }

  initLayoutWithoutSidePanels(): Layout {
    const rootLayout = new BoxLayout();

    BoxLayout.setStretch(this._main, 1);

    this._spacer = new Widget();
    this._spacer.id = 'spacer-widget';

    rootLayout.spacing = 0;
    rootLayout.addWidget(this._topWrapper);
    rootLayout.addWidget(this._menuWrapper);
    rootLayout.addWidget(this._spacer);
    rootLayout.addWidget(this._main);

    return rootLayout;
  }

  initLayoutWithSidePanels(): Layout {
    const rootLayout = new BoxLayout();
    const leftHandler = this._leftHandler;
    const rightHandler = this._rightHandler;
    const mainPanel = this._main;

    this.leftPanel.id = 'jp-left-stack';
    this.rightPanel.id = 'jp-right-stack';

    // Hide the side panels by default.
    leftHandler.hide();
    rightHandler.hide();

    // TODO: Consider storing this as an attribute this._hsplitPanel if saving/restoring layout needed
    const hsplitPanel = new SplitPanel();
    hsplitPanel.id = 'main-split-panel';
    hsplitPanel.spacing = 1;

    // Catch current changed events on the side handlers.
    leftHandler.updated.connect(this._onLayoutModified, this);
    rightHandler.updated.connect(this._onLayoutModified, this);

    BoxLayout.setStretch(hsplitPanel, 1);

    SplitPanel.setStretch(leftHandler.stackedPanel, 0);
    SplitPanel.setStretch(rightHandler.stackedPanel, 0);
    SplitPanel.setStretch(mainPanel, 1);

    hsplitPanel.addWidget(leftHandler.stackedPanel);
    hsplitPanel.addWidget(mainPanel);
    hsplitPanel.addWidget(rightHandler.stackedPanel);

    // Use relative sizing to set the width of the side panels.
    // This will still respect the min-size of children widget in the stacked
    // panel.
    hsplitPanel.setRelativeSizes([1, 2.5, 1]);

    rootLayout.spacing = 0;
    rootLayout.addWidget(this._topWrapper);
    rootLayout.addWidget(this._menuWrapper);
    rootLayout.addWidget(this._spacer);
    rootLayout.addWidget(hsplitPanel);

    return rootLayout;
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
  get leftPanel(): StackedPanel {
    return this._leftHandler.stackedPanel;
  }

  /**
   * Shortcut to get the right area handler's stacked panel
   */
  get rightPanel(): StackedPanel {
    return this._rightHandler.stackedPanel;
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
   * Activate a widget in its area.
   */
  activateById(id: string): void {
    // Search all areas that can have widgets for this widget, starting with main.
    for (const area of ['main', 'top', 'left', 'right', 'menu']) {
      if ((area === 'left' || area === 'right') && !this.sidePanelsVisible()) {
        continue;
      }

      const widget = find(this.widgets(area), w => w.id === id);
      if (widget) {
        widget.activate();
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
        break;
      case 'left':
        if (this.sidePanelsVisible()) {
          return this._leftHandler.addWidget(widget, rank);
        }
        throw new Error(`${area} area is not available on this page`);
      case 'right':
        if (this.sidePanelsVisible()) {
          return this._rightHandler.addWidget(widget, rank);
        }
        throw new Error(`${area} area is not available on this page`);
      default:
        throw new Error(`Cannot add widget to area: ${area}`);
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
  expandLeft(): void {
    if (!this.sidePanelsVisible()) {
      throw new Error('Left panel is not available on this page');
    }
    this.leftPanel.show();
    this._leftHandler.expand(); // Show the current widget, if any
    this._onLayoutModified();
  }

  /**
   * Collapse the left panel
   */
  collapseLeft(): void {
    if (!this.sidePanelsVisible()) {
      throw new Error('Left panel is not available on this page');
    }
    this._leftHandler.collapse();
    this.leftPanel.hide();
    this._onLayoutModified();
  }

  /**
   * Expand the right panel to show the sidebar with its widget.
   */
  expandRight(): void {
    if (!this.sidePanelsVisible()) {
      throw new Error('Right panel is not available on this page');
    }
    this.rightPanel.show();
    this._rightHandler.expand(); // Show the current widget, if any
    this._onLayoutModified();
  }

  /**
   * Collapse the right panel
   */
  collapseRight(): void {
    if (!this.sidePanelsVisible()) {
      throw new Error('Right panel is not available on this page');
    }
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
        if (this.sidePanelsVisible()) {
          return this._leftHandler.stackedPanel.widgets;
        }
        throw new Error(`Invalid area: ${area}`);
      case 'right':
        if (this.sidePanelsVisible()) {
          return this._rightHandler.stackedPanel.widgets;
        }
        throw new Error(`Invalid area: ${area}`);
      default:
        console.error(`This shell has no area called "${area}"`);
        return;
    }
  }

  /**
   * Return the list of widgets for the given area.
   *
   * @param area The area
   */
  // widgets(area?: string): IIterator<Widget> {
  //   return iter(this.widgetsList(area));
  // }

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
   * Can the shell display a left or right panel?
   *
   * @returns True if the left and right side panels could be shown, false otherwise
   */
  sidePanelsVisible(): boolean {
    return PageConfig.getOption('notebookPage') === 'notebooks';
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
    constructor() {
      this._stackedPanel = new StackedPanel();
      this._stackedPanel.hide();
      this._current = null;
      this._lastCurrent = null;
      this._stackedPanel.widgetRemoved.connect(this._onWidgetRemoved, this);
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
      return this._stackedPanel.isVisible;
    }

    /**
     * Get the stacked panel managed by the handler
     */
    get stackedPanel(): StackedPanel {
      return this._stackedPanel;
    }

    /**
     * Signal fires when the stacked panel changes
     */
    get updated(): ISignal<SideBarHandler, void> {
      return this._updated;
    }

    /**
     * Expand the sidebar.
     *
     * #### Notes
     * This will open the most recently used widget, or the first widget
     * if there is no most recently used.
     */
    expand(): void {
      const visibleWidget = this.current;
      if (visibleWidget) {
        this._current = visibleWidget;
        this.activate(visibleWidget.id);
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
      this._stackedPanel.insertWidget(index, widget);

      // TODO: Update menu to include widget in appropriate position

      this._refreshVisibility();
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
      this._stackedPanel.setHidden(this._isHiddenByUser);
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
      // TODO: Remove the widget from the menu
      this._refreshVisibility();
    }

    private _isHiddenByUser = false;
    private _items = new Array<Private.IRankItem>();
    private _stackedPanel: StackedPanel;
    private _current: Widget | null;
    private _lastCurrent: Widget | null;
    private _updated: Signal<SideBarHandler, void> = new Signal(this);
  }
}
