// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterFrontEnd } from '@jupyterlab/application';
import { DocumentRegistry } from '@jupyterlab/docregistry';

import { find } from '@lumino/algorithm';
import { PromiseDelegate, Token } from '@lumino/coreutils';
import { ISignal, Signal } from '@lumino/signaling';

import { BoxLayout, Panel, SplitPanel, Widget } from '@lumino/widgets';
import { PanelHandler, SidePanelHandler } from './panelhandler';

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

    this._topHandler = new PanelHandler();
    this._menuHandler = new PanelHandler();
    this._leftHandler = new SidePanelHandler('left');
    this._rightHandler = new SidePanelHandler('right');
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

    leftHandler.panel.id = 'jp-left-stack';
    rightHandler.panel.id = 'jp-right-stack';

    // Hide the side panels by default.
    leftHandler.hide();
    rightHandler.hide();

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
   * Activate a widget in its area.
   */
  activateById(id: string): void {
    // Search all areas that can have widgets for this widget, starting with main.
    for (const area of ['main', 'top', 'left', 'right', 'menu']) {
      const widget = find(this.widgets(area as Shell.Area), w => w.id === id);
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
    area?: Shell.Area,
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
      case 'left':
        yield* this._leftHandler.widgets;
        return;
      case 'right':
        yield* this._rightHandler.widgets;
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

  private _topWrapper: Panel;
  private _topHandler: PanelHandler;
  private _menuWrapper: Panel;
  private _menuHandler: PanelHandler;
  private _leftHandler: SidePanelHandler;
  private _rightHandler: SidePanelHandler;
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
