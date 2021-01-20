// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { showDialog, Dialog } from '@jupyterlab/apputils';

import { IMainMenu } from '@jupyterlab/mainmenu';

import { jupyterlabClassicIcon } from '@jupyterlab-classic/ui-components';

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
 * The help plugin.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-classic/help-extension:plugin',
  autoStart: true,
  optional: [IMainMenu],
  activate: (app: JupyterFrontEnd, menu: IMainMenu): void => {
    const { commands } = app;

    commands.addCommand(CommandIDs.open, {
      label: args => args['text'] as string,
      execute: args => {
        const url = args['url'] as string;
        window.open(url);
      }
    });

    commands.addCommand(CommandIDs.shortcuts, {
      label: 'Keyboard Shortcuts',
      execute: () => {
        const title = (
          <span className="jp-AboutClassic-about-header">
            <div className="jp-AboutClassic-about-header-info">
              Keyboard Shortcuts
            </div>
          </span>
        );

        const body = (
          <table className="jp-AboutClassic-shortcuts">
            <thead>
              <tr>
                <th>Name</th>
                <th>Shortcut</th>
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
              label: 'Dismiss',
              className:
                'jp-AboutClassic-about-button jp-mod-reject jp-mod-styled'
            })
          ]
        });
      }
    });

    commands.addCommand(CommandIDs.about, {
      label: `About ${app.name}`,
      execute: () => {
        const title = (
          <>
            <span className="jp-AboutClassic-header">
              <jupyterlabClassicIcon.react height="128px" width="auto" />
            </span>
          </>
        );

        const classicNotebookURL =
          'https://github.com/jtpio/jupyterlab-classic';
        const externalLinks = (
          <span>
            <a
              href={classicNotebookURL}
              target="_blank"
              rel="noopener noreferrer"
              className="jp-Button-flat jp-AboutClassic-about-externalLinks"
            >
              JUPYTERLAB CLASSIC ON GITHUB
            </a>
          </span>
        );
        const body = (
          <>
            <span className="jp-AboutClassic-body">Version: {app.version}</span>
            <div>{externalLinks}</div>
          </>
        );

        return showDialog({
          title,
          body,
          buttons: [
            Dialog.createButton({
              label: 'Dismiss',
              className:
                'jp-AboutClassic-about-button jp-mod-reject jp-mod-styled'
            })
          ]
        });
      }
    });

    const resourcesGroup = RESOURCES.map(args => ({
      args,
      command: CommandIDs.open
    }));

    menu.helpMenu.addGroup([{ command: CommandIDs.about }]);
    menu.helpMenu.addGroup([{ command: CommandIDs.shortcuts }]);
    menu.helpMenu.addGroup(resourcesGroup);
  }
};

export default plugin;
