import { Token } from '@lumino/coreutils';

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
