// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { URLExt } from '@jupyterlab/coreutils';

import { INotebookPathOpener } from './tokens';

/**
 * A class to open path in new browser tabs in the Notebook application.
 */
class DefaultNotebookPathOpener implements INotebookPathOpener {
  /**
   * Open a path in a new browser tab.
   */
  open(options: INotebookPathOpener.IOpenOptions): WindowProxy | null {
    const { prefix: route, path, searchParams, target, features } = options;
    const url = new URL(URLExt.join(route, path ?? ''), window.location.origin);
    if (searchParams) {
      url.search = searchParams.toString();
    }
    return window.open(url, target, features);
  }
}

export const defaultNotebookPathOpener = new DefaultNotebookPathOpener();