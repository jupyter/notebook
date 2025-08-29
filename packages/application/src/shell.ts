// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterFrontEnd } from '@jupyterlab/application';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { ITranslator, nullTranslator } from '@jupyterlab/translation';

import { find } from '@lumino/algorithm';
import { JSONExt, PromiseDelegate, Token } from '@lumino/coreutils';
import { ISignal, Signal } from '@lumino/signaling';

import {
  BoxLayout,
  FocusTracker,
  Panel,
  SplitPanel,
  TabPanel,
  Widget,
} from '@lumino/widgets';
import { PanelHandler, SidePanelHandler } from './panelhandler';
import { TabPanelSvg } from '@jupyterlab/ui-components';

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
 * The namespace for INotebookShell type information.
 */
export namespace INotebookShell {
  /**
   * The areas of the application shell where widgets can reside.
   */
  export type Area = 'main' | 'top' | 'menu' | 'left' | 'right' | 'down';

  /**
   * Widget position
   */
  export interface IWidgetPosition {
    /**
     * Widget area
     */
    area?: Area;
    /**
     * Widget opening options
     */
    options?: DocumentRegistry.IOpenOptions;
  }

  /**
   * Mapping of widget type identifier and their user customized position
   */
  export interface IUserLayout {
    /**
     * Widget customized position
     */
    [k: string]: IWidgetPosition;
  }
}

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
    this._userLayout = {};

    this._topHandler = new PanelHandler();
    this._menuHandler = new PanelHandler();
    this._leftHandler = new SidePanelHandler('left');
    this._rightHandler = new SidePanelHandler('right');
    this._main = new Panel();
    const topWrapper = (this._topWrapper = new Panel());
    const menuWrapper = (this._menuWrapper = new Panel());

    this._topHandler.panel.id = 'top-panel';
    this._topHandler.panel.node.setAttribute('role', 'banner');
    this._menuHandler.panel.id = 'menu-panel';
    this._menuHandler.panel.node.setAttribute('role', 'navigation');
    this._main.id = 'main-panel';
    this._main.node.setAttribute('role', 'main');

    this._spacer_top = new Widget();
    this._spacer_top.id = 'spacer-widget-top';
    this._spacer_bottom = new Widget();
    this._spacer_bottom.id = 'spacer-widget-bottom';

    // create wrappers around the top and menu areas
    topWrapper.id = 'top-panel-wrapper';
    topWrapper.addWidget(this._topHandler.panel);

    menuWrapper.id = 'menu-panel-wrapper';
    menuWrapper.addWidget(this._menuHandler.panel);

    const rootLayout = new BoxLayout();
    const leftHandler = this._leftHandler;
    const rightHandler = this._rightHandler;

    leftHandler.panel.id = 'jp-left-stack';
    leftHandler.panel.node.setAttribute('role', 'complementary');
    rightHandler.panel.id = 'jp-right-stack';
    rightHandler.panel.node.setAttribute('role', 'complementary');

    // Hide the side panels by default.
    leftHandler.hide();
    rightHandler.hide();

    const middleLayout = new BoxLayout({
      spacing: 0,
      direction: 'top-to-bottom',
    });
    BoxLayout.setStretch(this._topWrapper, 0);
    BoxLayout.setStretch(this._menuWrapper, 0);
    BoxLayout.setStretch(this._main, 1);

    const middlePanel = new Panel({ layout: middleLayout });
    middlePanel.addWidget(this._topWrapper);
    middlePanel.addWidget(this._menuWrapper);
    middlePanel.addWidget(this._spacer_top);
    middlePanel.addWidget(this._main);
    middlePanel.addWidget(this._spacer_bottom);
    middlePanel.layout = middleLayout;

    const vsplitPanel = new SplitPanel();
    vsplitPanel.id = 'jp-main-vsplit-panel';
    vsplitPanel.spacing = 1;
    vsplitPanel.orientation = 'vertical';
    SplitPanel.setStretch(vsplitPanel, 1);

    const downPanel = new TabPanelSvg({
      tabsMovable: true,
    });
    this._downPanel = downPanel;
    this._downPanel.id = 'jp-down-stack';

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

    vsplitPanel.addWidget(hsplitPanel);
    vsplitPanel.addWidget(downPanel);

    rootLayout.spacing = 0;
    rootLayout.addWidget(vsplitPanel);

    // initially hiding the down panel
    this._downPanel.hide();

    // Connect down panel change listeners
    this._downPanel.tabBar.tabMoved.connect(this._onTabPanelChanged, this);
    this._downPanel.stackedPanel.widgetRemoved.connect(
      this._onTabPanelChanged,
      this
    );

    this.layout = rootLayout;

    // Added Skip to Main Link
    const skipLinkWidgetHandler = (this._skipLinkWidgetHandler =
      new Private.SkipLinkWidgetHandler(this));

    this.add(skipLinkWidgetHandler.skipLinkWidget, 'top', { rank: 0 });
    this._skipLinkWidgetHandler.show();
  }

  /**
   * A signal emitted when the current widget changes.
   */
  get currentChanged(): ISignal<
    JupyterFrontEnd.IShell,
    FocusTracker.IChangedArgs<Widget>
  > {
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
  get leftHandler(): SidePanelHandler {
    return this._leftHandler;
  }

  /**
   * Get the right area handler
   */
  get rightHandler(): SidePanelHandler {
    return this._rightHandler;
  }

  /**
   * Is the left sidebar visible?
   */
  get leftCollapsed(): boolean {
    return !(this._leftHandler.isVisible && this._leftHandler.panel.isVisible);
  }

  /**
   * Is the right sidebar visible?
   */
  get rightCollapsed(): boolean {
    return !(
      this._rightHandler.isVisible && this._rightHandler.panel.isVisible
    );
  }

  /**
   * Promise that resolves when the main widget is loaded
   */
  get restored(): Promise<void> {
    return this._mainWidgetLoaded.promise;
  }

  /**
   * Getter and setter for the translator.
   */
  get translator(): ITranslator {
    return this._translator ?? nullTranslator;
  }
  set translator(value: ITranslator) {
    if (value !== this._translator) {
      this._translator = value;
      const trans = value.load('notebook');
      this._leftHandler.closeButton.title = trans.__(
        'Collapse %1 side panel',
        this._leftHandler.area
      );
      this._rightHandler.closeButton.title = trans.__(
        'Collapse %1 side panel',
        this._rightHandler.area
      );
    }
  }

  /**
   * User custom shell layout.
   */
  get userLayout() {
    return JSONExt.deepCopy(this._userLayout as any);
  }

  /**
   * Activate a widget in its area.
   */
  activateById(id: string): void {
    // Search all areas that can have widgets for this widget, starting with main.
    for (const area of ['main', 'top', 'left', 'right', 'menu', 'down']) {
      const widget = find(
        this.widgets(area as INotebookShell.Area),
        (w) => w.id === id
      );
      if (widget) {
        if (area === 'left') {
          this.expandLeft(id);
        } else if (area === 'right') {
          this.expandRight(id);
        } else if (area === 'down') {
          const tabIndex = this._downPanel.tabBar.titles.findIndex(
            (title) => title.owner.id === id
          );
          if (tabIndex >= 0) {
            this._downPanel.currentIndex = tabIndex;
          }
          this._downPanel.show();
          widget.activate();
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
    area?: INotebookShell.Area,
    options?: DocumentRegistry.IOpenOptions
  ): void {
    let userPosition: INotebookShell.IWidgetPosition | undefined;
    if (options?.type && this._userLayout[options.type]) {
      userPosition = this._userLayout[options.type];
    } else {
      userPosition = this._userLayout[widget.id];
    }

    area = userPosition?.area ?? area;
    options =
      options || userPosition?.options
        ? {
            ...options,
            ...userPosition?.options,
          }
        : undefined;

    const rank = options?.rank ?? DEFAULT_RANK;
    switch (area) {
      case 'top':
        return this._topHandler.addWidget(widget, rank);
      case 'menu':
        return this._menuHandler.addWidget(widget, rank);
      case 'main':
      case undefined: {
        if (this._main.widgets.length > 0) {
          // do not add the widget if there is already one
          return;
        }
        const previousWidget = this.currentWidget;
        this._main.addWidget(widget);
        this._main.update();
        this._currentChanged.emit({
          newValue: widget,
          oldValue: previousWidget,
        });
        this._mainWidgetLoaded.resolve();
        break;
      }
      case 'left':
        return this._leftHandler.addWidget(widget, rank);
      case 'right':
        return this._rightHandler.addWidget(widget, rank);
      case 'down':
        return this._downPanel.addWidget(widget);
      default:
        console.warn(`Cannot add widget to area: ${area}`);
    }
  }

  /**
   * Collapse the top area and the spacer to make the view more compact.
   */
  collapseTop(): void {
    this._topWrapper.setHidden(true);
    this._spacer_top.setHidden(true);
  }

  /**
   * Expand the top area to show the header and the spacer.
   */
  expandTop(): void {
    this._topWrapper.setHidden(false);
    this._spacer_top.setHidden(false);
  }

  /**
   * Return the list of widgets for the given area.
   *
   * @param area The area
   */
  *widgets(area: INotebookShell.Area): IterableIterator<Widget> {
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
      case 'left':
        yield* this._leftHandler.widgets;
        return;
      case 'right':
        yield* this._rightHandler.widgets;
        return;
      case 'down':
        yield* this._downPanel.widgets;
        return;
      default:
        console.error(`This shell has no area called "${area}"`);
        return;
    }
  }

  /**
   * Expand the left panel to show the sidebar with its widget.
   */
  expandLeft(id?: string): void {
    this._leftHandler.panel.show();
    this._leftHandler.expand(id); // Show the current widget, if any
  }

  /**
   * Collapse the left panel
   */
  collapseLeft(): void {
    this._leftHandler.collapse();
    this._leftHandler.panel.hide();
  }

  /**
   * Expand the right panel to show the sidebar with its widget.
   */
  expandRight(id?: string): void {
    this._rightHandler.panel.show();
    this._rightHandler.expand(id); // Show the current widget, if any
  }

  /**
   * Collapse the right panel
   */
  collapseRight(): void {
    this._rightHandler.collapse();
    this._rightHandler.panel.hide();
  }

  /**
   * Restore the layout state and configuration for the application shell.
   */
  async restoreLayout(
    configuration: INotebookShell.IUserLayout
  ): Promise<void> {
    this._userLayout = configuration;
  }

  /**
   * Handle a change on the down panel widgets
   */
  private _onTabPanelChanged(): void {
    if (this._downPanel.stackedPanel.widgets.length === 0) {
      this._downPanel.hide();
    }
  }

  private _topWrapper: Panel;
  private _topHandler: PanelHandler;
  private _menuWrapper: Panel;
  private _menuHandler: PanelHandler;
  private _leftHandler: SidePanelHandler;
  private _rightHandler: SidePanelHandler;
  private _spacer_top: Widget;
  private _spacer_bottom: Widget;
  private _skipLinkWidgetHandler: Private.SkipLinkWidgetHandler;
  private _main: Panel;
  private _downPanel: TabPanel;
  private _translator: ITranslator = nullTranslator;
  private _currentChanged = new Signal<this, FocusTracker.IChangedArgs<Widget>>(
    this
  );
  private _mainWidgetLoaded = new PromiseDelegate<void>();
  private _userLayout: INotebookShell.IUserLayout;
}

export namespace Private {
  export class SkipLinkWidgetHandler {
    /**
     * Construct a new skipLink widget handler.
     */
    constructor(shell: INotebookShell) {
      const skipLinkWidget = (this._skipLinkWidget = new Widget());
      const skipToMain = document.createElement('a');
      skipToMain.href = '#first-cell';
      skipToMain.tabIndex = 1;
      skipToMain.text = 'Skip to Main';
      skipToMain.className = 'skip-link';
      skipToMain.addEventListener('click', this);
      skipLinkWidget.addClass('jp-skiplink');
      skipLinkWidget.id = 'jp-skiplink';
      skipLinkWidget.node.appendChild(skipToMain);
    }

    handleEvent(event: Event): void {
      switch (event.type) {
        case 'click':
          this._focusMain();
          break;
      }
    }

    private _focusMain() {
      const input = document.querySelector(
        '#main-panel .jp-InputArea-editor'
      ) as HTMLInputElement;
      input.tabIndex = 1;
      input.focus();
    }

    /**
     * Get the input element managed by the handler.
     */
    get skipLinkWidget(): Widget {
      return this._skipLinkWidget;
    }

    /**
     * Dispose of the handler and the resources it holds.
     */
    dispose(): void {
      if (this.isDisposed) {
        return;
      }
      this._isDisposed = true;
      this._skipLinkWidget.node.removeEventListener('click', this);
      this._skipLinkWidget.dispose();
    }

    /**
     * Hide the skipLink widget.
     */
    hide(): void {
      this._skipLinkWidget.hide();
    }

    /**
     * Show the skipLink widget.
     */
    show(): void {
      this._skipLinkWidget.show();
    }

    /**
     * Test whether the handler has been disposed.
     */
    get isDisposed(): boolean {
      return this._isDisposed;
    }

    private _skipLinkWidget: Widget;
    private _isDisposed = false;
  }
}
