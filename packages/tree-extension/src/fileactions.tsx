// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  CommandToolbarButtonComponent,
  ReactWidget,
} from '@jupyterlab/apputils';

import { FileBrowser } from '@jupyterlab/filebrowser';

import { ITranslator } from '@jupyterlab/translation';

import { CommandRegistry } from '@lumino/commands';

import { ISignal } from '@lumino/signaling';

import React from 'react';

export class FilesActionButtons {
  /**
   * The constructor of FilesActionButtons.
   * @param options
   */
  constructor(options: {
    commands: CommandRegistry;
    browser: FileBrowser;
    selectionChanged: ISignal<FileBrowser, void>;
    translator: ITranslator;
  }) {
    this._browser = options.browser;
    const { commands, selectionChanged, translator } = options;
    const trans = translator.load('notebook');

    // Placeholder, when no file is selected.
    const placeholder = ReactWidget.create(
      <div key={'placeholder'}>
        {trans.__('Select items to perform actions on them.')}
      </div>
    );
    placeholder.id = 'fileAction-placeholder';
    this._widgets.set('placeholder', placeholder);

    // The action buttons.
    const actions = ['open', 'download', 'rename', 'duplicate', 'delete'];
    actions.forEach((action) => {
      const widget = ReactWidget.create(
        <CommandToolbarButtonComponent
          key={action}
          commands={commands}
          id={`filebrowser:${action}`}
          args={{ toolbar: true }}
          icon={undefined}
        />
      );
      widget.id = `fileAction-${action}`;
      widget.addClass('jp-ToolbarButton');
      widget.addClass('jp-FileAction');
      this._widgets.set(action, widget);
    });

    selectionChanged.connect(this._onSelectionChanged, this);
    this._onSelectionChanged();
  }

  /**
   * Return an iterator with all the action widgets.
   */
  get widgets(): IterableIterator<ReactWidget> {
    return this._widgets.values();
  }

  /**
   * Triggered when the selection change in file browser.
   */
  private _onSelectionChanged = () => {
    const selectedItems = Array.from(this._browser.selectedItems());
    const selection = selectedItems.length > 0;
    const oneFolder = selectedItems.some((item) => item.type === 'directory');

    this._widgets.get('placeholder')?.setHidden(selection);
    this._widgets.get('delete')?.setHidden(!selection);
    this._widgets.get('duplicate')?.setHidden(!selection || oneFolder);
    this._widgets.get('download')?.setHidden(!selection || oneFolder);
    this._widgets.get('open')?.setHidden(!selection || oneFolder);
    this._widgets.get('rename')?.setHidden(selectedItems.length !== 1);
  };

  private _browser: FileBrowser;
  private _widgets = new Map<string, ReactWidget>();
}
