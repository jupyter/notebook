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

/**
 * Command IDs used by notebook toolbar items
 */
namespace CommandIDs {
  /**
   * Open current notebook in classic notebook
   */
  export const openClassic = 'retro:open-classic';
  /**
   * Open current notebook in JupyterLab
   */
  export const openLab = 'retro:open-lab';
}

class InterfaceSwitcher extends ReactWidget {
  constructor(private commands: CommandRegistry) {
    super();
    this.addClass('jp-Notebook-toolbarCellType');
  }

  onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const target = event.target.value;
    if (target === '-') {
      return;
    }
    this.commands.execute(target);
  };

  render = () => {
    return (
      <HTMLSelect
        onChange={this.onChange}
        className="jp-Notebook-toolbarCellTypeDropdown"
      >
        <option value="-">Interface</option>
        <option value={CommandIDs.openClassic}>Classic</option>
        <option value={CommandIDs.openLab}>JupyterLab</option>
      </HTMLSelect>
    );
  };
}

/**
 * A notebook widget extension that adds a open in classic notebook button to the toolbar.
 */
class InterfaceSwitcherButton
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  constructor(commands: CommandRegistry) {
    this._commands = commands;
  }

  createNew(panel: NotebookPanel): IDisposable {
    const switcher = new InterfaceSwitcher(this._commands);
    panel.toolbar.insertBefore('kernelName', 'switch-interface', switcher);
    return switcher;
  }

  private _commands: CommandRegistry;
}

/**
 * A plugin to add custom toolbar items to the notebook page
 */
const notebookToolbarItems: JupyterFrontEndPlugin<void> = {
  id: '@retrolab/notebook-extension:open-classic',
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

    const isEnabled = () => {
      return (
        notebookTracker.currentWidget !== null &&
        notebookTracker.currentWidget === shell.currentWidget
      );
    };

    commands.addCommand(CommandIDs.openClassic, {
      label: 'Open in Classic Notebook',
      execute: () => {
        const current = notebookTracker.currentWidget;
        if (!current) {
          return;
        }
        window.open(`${baseUrl}tree/${current.context.path}`);
      },
      isEnabled
    });

    commands.addCommand(CommandIDs.openLab, {
      label: 'Open in JupyterLab',
      execute: () => {
        const current = notebookTracker.currentWidget;
        if (!current) {
          return;
        }
        window.open(`${baseUrl}lab/tree/${current.context.path}`);
      },
      isEnabled
    });

    if (palette) {
      palette.addItem({ command: CommandIDs.openClassic, category: 'Other' });
    }

    if (menu) {
      menu.viewMenu.addGroup([{ command: CommandIDs.openClassic }], 1);
    }

    const interfaceSwitcher = new InterfaceSwitcherButton(commands);
    docRegistry.addWidgetExtension('Notebook', interfaceSwitcher);
  }
};

export { notebookToolbarItems as addNotebookToolbarItems };
