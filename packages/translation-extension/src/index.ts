import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ITranslator } from '@jupyterlab/translation';
import { INotebookShell } from '@jupyter-notebook/application';

const translator: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/terminal-extension:opener',
  requires: [INotebookShell, ITranslator],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    notebookShell: INotebookShell,
    translator: ITranslator
  ) => {
    notebookShell.translator = translator;
  }
};

export default translator;
