import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';
import { Dialog, ICommandPalette } from '@jupyterlab/apputils';
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
    url: 'https://jupyter.org',
  },
  {
    text: 'Markdown Reference',
    url: 'https://commonmark.org/help/',
  },
  {
    text: 'Documentation',
    url: 'https://jupyter-notebook.readthedocs.io/en/stable/',
  },
];

/**
