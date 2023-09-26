import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { ICommandPalette } from '@jupyterlab/apputils';

/**
 * Initialization the functionality for the Classic Shortcuts extension.
 */
const classicShortcutsPlugin: JupyterFrontEndPlugin<void> = {
  id: 'classic-shortcuts:plugin',
  description: 'A JupyterLab extension.',
  autoStart: false,
  requires: [ICommandPalette],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette) => {
    const { commands } = app;

    const toggle_collapse_output_command = 'classic:toggle-collapse-output';
    const toggle_autoscroll_output_command = 'classic:toggle-output-scrolling';
    const toggle_line_numbers_command = 'classic:toggle-line-numbers';

    // Add a command to enable/disable collapse output
    commands.addCommand(toggle_collapse_output_command, {
      label: 'Execute classic:toggle-collapse-output Command',
      caption: 'Execute classic:toggle-collapse-output Command',
      execute: (args: any) => {
        console.log('classic:toggle-collapse-output has been called');

        const searchActive = document.querySelector(
          '.jp-mod-active.jp-mod-selected'
        );
        if (searchActive?.children) {
          for (let i = 0; i < searchActive?.children.length; i++) {
            const outputArea = searchActive.children[i].querySelector(
              '.jp-Cell-outputArea'
            );
            const placeholderArea = searchActive.children[i].querySelector(
              '.jp-OutputPlaceholder'
            );

            if (outputArea) {
              commands.execute('notebook:hide-cell-outputs');
            }

            if (placeholderArea) {
              commands.execute('notebook:show-cell-outputs');
            }
          }
        }
      },
    });

    // Add a command to enable/disable autscroll output
    commands.addCommand(toggle_autoscroll_output_command, {
      label: 'Execute classic:toggle-output-scrolling Command',
      caption: 'Execute classic:toggle-output-scrolling Command',
      execute: (args: any) => {
        console.log('classic:toggle-output-scrolling has been called.');
        // if the output has auto-scroll enabled, disable it and vice-versa
        const searchActive = document.querySelector(
          '.jp-mod-active.jp-mod-selected.jp-mod-outputsScrolled'
        );
        if (searchActive) {
          commands.execute('notebook:disable-output-scrolling');
        } else {
          commands.execute('notebook:enable-output-scrolling');
        }
      },
    });

    // Add a command to enable/disable line numbers
    commands.addCommand(toggle_line_numbers_command, {
      label: 'Execute classic:toggle-line-numbers Command',
      caption: 'Execute classic:toggle-line-numbers Command',
      execute: (args: any) => {
        console.log('classic:toggle-line-numbers has been called.');
        // if the output has auto-scroll enabled, disable it and vice-versa
        const searchActive = document.querySelector(
          '.jp-mod-active.jp-mod-selected'
        );
        if (searchActive) {
          commands.execute('notebook:disable-output-scrolling');
        }
      },
    });

    // Add the commands to the command palette
    const category = 'Classic Notebook Shortcuts';
    palette.addItem({
      command: toggle_collapse_output_command,
      category,
      args: { origin: 'from palette ' },
    });

    palette.addItem({
      command: toggle_autoscroll_output_command,
      category,
      args: { origin: 'from palette ' },
    });

    console.log('Classic Shortcuts extension is activated!');
  },
};

export default classicShortcutsPlugin;
