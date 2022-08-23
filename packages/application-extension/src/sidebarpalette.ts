import { ICommandPalette } from '@jupyterlab/apputils';
import { IDisposable } from '@lumino/disposable';
import { Widget } from '@lumino/widgets';

/**
 * A class to manages the palette entries associated to the side bar.
 */
export class SideBarPalette {
  /**
   * Construct a new side bar palette.
   */
  constructor(options: SideBarPaletteOption) {
    this._commandPalette = options.commandPalette;
    this._command = options.command;
  }

  /**
   * Get a command palette item from the widget id and the area.
   */
  getItem(
    widget: Readonly<Widget>,
    area: 'left' | 'right'
  ): SideBarPaletteItem | null {
    const itemList = this._items;
    for (let i = 0; i < itemList.length; i++) {
      const item = itemList[i];
      if (item.widgetId == widget.id && item.area == area) {
        return item;
      }
    }
    return null;
  }

  /**
   * Add an item to the command palette.
   */
  addItem(widget: Readonly<Widget>, area: 'left' | 'right'): void {
    // Check if the item does not already exist.
    if (this.getItem(widget, area)) {
      return;
    }

    // Add a new item in command palette.
    const disposableDelegate = this._commandPalette.addItem({
      command: this._command,
      category: 'View',
      args: {
        side: area,
        title: `Show ${widget.title.caption}`,
        id: widget.id
      }
    });

    // Keep the disposableDelegate objet to be able to dispose of the item if the widget
    // is remove from the side bar.
    this._items.push({
      widgetId: widget.id,
      area: area,
      disposable: disposableDelegate
    });
  }

  /**
   * Remove an item from the command palette.
   */
  removeItem(widget: Readonly<Widget>, area: 'left' | 'right'): void {
    const item = this.getItem(widget, area);
    if (item) {
      item.disposable.dispose();
    }
  }

  _command: string;
  _commandPalette: ICommandPalette;
  _items: SideBarPaletteItem[] = [];
}

type SideBarPaletteItem = {
  /**
   * The ID of the widget associated to the command palette.
   */
  widgetId: string;

  /**
   * The area of the panel associated to the command palette.
   */
  area: 'left' | 'right';

  /**
   * The disposable object to remove the item from command palette.
   */
  disposable: IDisposable;
};

/**
 * An interface for the options to include in SideBarPalette constructor.
 */
type SideBarPaletteOption = {
  /**
   * The commands palette.
   */
  commandPalette: ICommandPalette;

  /**
   * The command to call from each sidebar menu entry.
   *
   * ### Notes
   * That command required 3 args :
   *      side: 'left' | 'right', the area to toggle
   *      title: string, label of the command
   *      id: string, id of the widget to activate
   */
  command: string;
};
