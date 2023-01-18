// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { showDialog, Dialog, ICommandPalette } from '@jupyterlab/apputils';

import { IMainMenu } from '@jupyterlab/mainmenu';

import { ITranslator } from '@jupyterlab/translation';

import { jupyterIcon } from '@jupyter-notebook/ui-components';

import * as React from 'react';

/**
 * A list of resources to show in the help menu.
 */
const RESOURCES = [
  {
    text: 'About Jupyter',
    url: 'https://jupyter.org'
  },
  {
    text: 'Markdown Reference',
    url: 'https://commonmark.org/help/'
  }
];

/**
 * The command IDs used by the help plugin.
 */
namespace CommandIDs {
  export const open = 'help:open';

  export const shortcuts = 'help:shortcuts';

  export const about = 'help:about';
}

/**
 * A plugin to open the about section with resources.
 */
const open: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/help-extension:open',
  autoStart: true,
  activate: (app: JupyterFrontEnd): void => {
    const { commands } = app;

    commands.addCommand(CommandIDs.open, {
      label: args => args['text'] as string,
      execute: args => {
        const url = args['url'] as string;
        window.open(url);
      }
    });
  }
};

/**
 * Plugin to add a command to show an About Jupyter Notebook and Markdown Reference.
 */
const about: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/help-extension:about',
  autoStart: true,
  requires: [ITranslator],
  optional: [IMainMenu, ICommandPalette],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    menu: IMainMenu | null,
    palette: ICommandPalette | null
  ): void => {
    const { commands } = app;
    const trans = translator.load('notebook');
    const category = trans.__('Help');

    commands.addCommand(CommandIDs.about, {
      label: trans.__('About %1', app.name),
      execute: () => {
        const title = (
          <>
            <span className="jp-AboutNotebook-header">
              <jupyterIcon.react width="196px" height="auto" />
            </span>
          </>
        );

        const notebookURL = 'https://github.com/jupyter/notebook';
        const contributorURL = 'https://github.com/jupyter/notebook/pulse';
        const aboutJupyter = trans.__('JUPYTER NOTEBOOK ON GITHUB');
        const contributorList = trans.__('CONTRIBUTOR LIST');
        const externalLinks = (
          <span>
            <a
              href={notebookURL}
              target="_blank"
              rel="noopener noreferrer"
              className="jp-Button-flat jp-AboutNotebook-about-externalLinks"
            >
              {aboutJupyter}
            </a>
            <a
              href={contributorURL}
              target="_blank"
              rel="noopener noreferrer"
              className="jp-Button-flat jp-AboutNotebook-about-externalLinks"
            >
              {contributorList}
            </a>
          </span>
        );
        const version = trans.__('Version: %1', app.version);
        const copyright = trans.__('© 2021-2023 Jupyter Notebook Contributors');
        const body = (
          <>
            <span className="jp-AboutNotebook-version">{version}</span>
            <div>{externalLinks}</div>
            <span className="jp-AboutNotebook-about-copyright">
              {copyright}
            </span>
          </>
        );

        const dialog = new Dialog({
          title,
          body,
          buttons: [
            Dialog.createButton({
              label: trans.__('Dismiss'),
              className:
                'jp-AboutNotebook-about-button jp-mod-reject jp-mod-styled'
            })
          ]
        });
        dialog.addClass('jp-AboutNotebook');
        void dialog.launch();
      }
    });

    if (palette) {
      palette.addItem({ command: CommandIDs.about, category });
    }

    const resourcesGroup = RESOURCES.map(args => ({
      args,
      command: CommandIDs.open
    }));

    if (menu) {
      menu.helpMenu.addGroup(resourcesGroup, 30);
    }
  }
};

/**
 * A plugin to add a command to display Keyboard Shortcuts.
 */
const shortcuts: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/help-extension:shortcuts',
  autoStart: true,
  requires: [ITranslator],
  optional: [ICommandPalette],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    palette: ICommandPalette | null
  ): void => {
    const { commands } = app;
    const trans = translator.load('notebook');
    const category = trans.__('Help');

    commands.addCommand(CommandIDs.shortcuts, {
      label: trans.__('Keyboard Shortcuts'),
      execute: () => {
        const title = (
          <span className="jp-AboutNotebook-about-header">
            <div className="jp-AboutNotebook-about-header-info">
              {trans.__('Keyboard Shortcuts')}
            </div>
          </span>
        );

        const body = (
          <table className="jp-AboutNotebook-shortcuts">
            <thead>
              <tr>
                <th>{trans.__('Name')}</th>
                <th>{trans.__('Shortcut')}</th>
              </tr>
            </thead>
            <tbody>
              {commands.keyBindings
                .filter(binding => commands.isEnabled(binding.command))
                .map((binding, i) => (
                  <tr key={i}>
                    <td>{commands.label(binding.command)}</td>
                    <td>
                      <pre>{binding.keys.join(', ')}</pre>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        );

        return showDialog({
          title,
          body,
          buttons: [
            Dialog.createButton({
              label: trans.__('Dismiss'),
              className:
                'jp-AboutNotebook-about-button jp-mod-reject jp-mod-styled'
            })
          ]
        });
      }
    });

    if (palette) {
      palette.addItem({ command: CommandIDs.shortcuts, category });
    }
  }
};

const plugins: JupyterFrontEndPlugin<any>[] = [open, shortcuts, about];

export default plugins;
