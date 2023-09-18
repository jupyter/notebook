import { Token } from '@lumino/coreutils';

import { NotebookShell } from './shell';

/**
 * The INotebookPathOpener interface.
 */
export interface INotebookPathOpener {
  open: (route: string, path?: string) => void;
}

/**
 * The INotebookPathOpener token.
 */
export const INotebookPathOpener = new Token<INotebookPathOpener>(
  '@jupyter-notebook/application:INotebookPathOpener'
);

/**
 * The Jupyter Notebook application shell interface.
 */
export interface INotebookShell extends NotebookShell {}

/**
 * The Jupyter Notebook application shell token.
 */
export const INotebookShell = new Token<INotebookShell>(
  '@jupyter-notebook/application:INotebookShell'
);
