import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, ReactWidget } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IMainMenu } from '@jupyterlab/mainmenu';
import {
  INotebookModel,
  INotebookTracker,
  NotebookPanel
} from '@jupyterlab/notebook';
import { HTMLSelect } from '@jupyterlab/ui-components';
import { CommandRegistry } from '@lumino/commands';
import { IDisposable } from '@lumino/disposable';
import * as React from 'react';

interface ISwitcherChoice {
  command: string;
  dropdownLabel: string;
  commandLabel: string;
  urlPrefix: string;
  current: boolean;
}

class InterfaceSwitcher extends ReactWidget {
  private switcherChoices: ISwitcherChoice[];
  constructor(
    private commands: CommandRegistry,
    switcherChoices: ISwitcherChoice[]
  ) {
    super();
    this.addClass('jp-Notebook-toolbarCellType');
    this.switcherChoices = switcherChoices;
  }

  render = () => {
    return (
      <HTMLSelect
        className="jp-Notebook-toolbarCellTypeDropdown"
        value={this.switcherChoices.find(sc => sc.current)?.command}
      >
        {this.switcherChoices.map(sc => {
          return (
            <option
              key={sc.command}
              value={sc.command}
              onClick={() => !sc.current && this.commands.execute(sc.command)}
            >
              {sc.dropdownLabel}
            </option>
          );
        })}
      </HTMLSelect>
    );
  };
}

/**
 * A notebook widget extension that adds a open in classic notebook button to the toolbar.
 */
class InterfaceSwitcherButton
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  private switcherChoices: ISwitcherChoice[];

  constructor(commands: CommandRegistry, switcherChoices: ISwitcherChoice[]) {
    this._commands = commands;
    this.switcherChoices = switcherChoices;
  }

  createNew(panel: NotebookPanel): IDisposable {
    const switcher = new InterfaceSwitcher(
      this._commands,
      this.switcherChoices
    );
    panel.toolbar.insertBefore('kernelName', 'switch-interface', switcher);
    return switcher;
  }

  private _commands: CommandRegistry;
}

/**
 * A plugin to add custom toolbar items to the notebook page
 */
const interfaceSwitcher: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/lab-extension:interface-switcher',
  autoStart: true,
  optional: [INotebookTracker, ICommandPalette, IMainMenu],
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker | null,
    palette: ICommandPalette | null,
    menu: IMainMenu | null
  ) => {
    if (!notebookTracker) {
      // to prevent showing the toolbar button in RetroLab
      return;
    }

    const { commands, docRegistry, shell } = app;
    const baseUrl = PageConfig.getBaseUrl();

    const switcherChoices: ISwitcherChoice[] = [
      {
        command: 'retrolab:open-classic',
        commandLabel: 'Open in Classic Notebook',
        dropdownLabel: 'Classic',
        urlPrefix: `${baseUrl}tree/`,
        current: false
      },
      {
        command: 'retrolab:open-retro',
        commandLabel: 'Open in RetroLab',
        dropdownLabel: 'RetroLab',
        urlPrefix: `${baseUrl}retro/tree/`,
        current: app.name === 'RetroLab'
      },
      {
        command: 'retrolab:open-lab',
        commandLabel: 'Open in JupyterLab',
        dropdownLabel: 'JupyterLab',
        urlPrefix: `${baseUrl}lab/tree/`,
        current: app.name === 'JupyterLab'
      }
    ];

    const addInterface = (option: ISwitcherChoice) => {
      commands.addCommand(option.command, {
        label: option.commandLabel,
        execute: () => {
          const current = notebookTracker.currentWidget;
          if (!current) {
            return;
          }
          window.location.href = `${option.urlPrefix}${current.context.path}`;
        },
        isEnabled: () => {
          return (
            notebookTracker.currentWidget !== null &&
            notebookTracker.currentWidget === shell.currentWidget &&
            !option.current
          );
        }
      });

      if (palette) {
        palette.addItem({ command: option.command, category: 'Other' });
      }

      if (menu) {
        menu.viewMenu.addGroup([{ command: option.command }], 1);
      }
    };

    switcherChoices.map(iface => addInterface(iface));

    const interfaceSwitcher = new InterfaceSwitcherButton(
      commands,
      switcherChoices
    );
    docRegistry.addWidgetExtension('Notebook', interfaceSwitcher);
  }
};

export { interfaceSwitcher };
