// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  CommandToolbarButtonComponent,
  ReactWidget,
  UseSignal,
} from '@jupyterlab/apputils';

import { FileBrowser } from '@jupyterlab/filebrowser';

import { ITranslator } from '@jupyterlab/translation';

import { CommandRegistry } from '@lumino/commands';

import { ISignal } from '@lumino/signaling';

import React from 'react';

/**
 * A React component to display the list of command toolbar buttons.
 *
 */
const Commands = ({
  commands,
  browser,
  translator,
}: {
  commands: CommandRegistry;
  browser: FileBrowser;
  translator: ITranslator;
}): JSX.Element => {
  const trans = translator.load('notebook');
  const selection = Array.from(browser.selectedItems());
  const oneFolder = selection.some((item) => item.type === 'directory');
  const multipleFiles =
    selection.filter((item) => item.type === 'file').length > 1;
  if (selection.length === 0) {
    return <div>{trans.__('Select items to perform actions on them.')}</div>;
  } else {
    const buttons = ['delete'];
    if (!oneFolder) {
      buttons.unshift('duplicate');
      if (!multipleFiles) {
        buttons.unshift('rename');
      }
      buttons.unshift('download');
      buttons.unshift('open');
    } else {
      buttons.unshift('rename');
    }

    return (
      <>
        {buttons.map((action) => (
          <CommandToolbarButtonComponent
            key={action}
            commands={commands}
            id={`filebrowser:${action}`}
            args={{ toolbar: true }}
            icon={undefined}
          />
        ))}
      </>
    );
  }
};

/**
 * A React component to display the file action buttons in the file browser toolbar.
 *
 * @param translator The Translation service
 */
const FileActions = ({
  commands,
  browser,
  selectionChanged,
  translator,
}: {
  commands: CommandRegistry;
  browser: FileBrowser;
  selectionChanged: ISignal<FileBrowser, void>;
  translator: ITranslator;
}): JSX.Element => {
  return (
    <UseSignal signal={selectionChanged} shouldUpdate={() => true}>
      {(): JSX.Element => (
        <Commands
          commands={commands}
          browser={browser}
          translator={translator}
        />
      )}
    </UseSignal>
  );
};

/**
 * A namespace for FileActionsComponent statics.
 */
export namespace FileActionsComponent {
  /**
   * Create a new FileActionsComponent
   *
   * @param translator The translator
   */
  export const create = ({
    commands,
    browser,
    selectionChanged,
    translator,
  }: {
    commands: CommandRegistry;
    browser: FileBrowser;
    selectionChanged: ISignal<FileBrowser, void>;
    translator: ITranslator;
  }): ReactWidget => {
    const widget = ReactWidget.create(
      <FileActions
        commands={commands}
        browser={browser}
        selectionChanged={selectionChanged}
        translator={translator}
      />
    );
    widget.addClass('jp-FileActions');
    return widget;
  };
}
