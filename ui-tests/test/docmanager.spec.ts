// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { test } from './fixtures';

import { expect } from '@jupyterlab/galata';

const NOTEBOOK = 'empty.ipynb';

test.describe('Document Manager', () => {
  test.beforeEach(async ({ page, tmpPath }) => {
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${NOTEBOOK}`),
      `${tmpPath}/${NOTEBOOK}`
    );
  });

  test('Should open a notebook page for a factory whose model is notebook', async ({
    page,
    tmpPath,
  }) => {
    const openedUrl = await page.evaluate(
      async ({ notebookPath }) => {
        const app = window.jupyterapp;
        const notebook = app.docRegistry.getWidgetFactory('Notebook') as any;
        app.docRegistry.addWidgetFactory(
          new notebook.constructor({
            name: 'Another view',
            fileTypes: ['notebook'],
            modelName: 'notebook',
            preferKernel: true,
            canStartKernel: true,
            rendermime: notebook.rendermime,
            contentFactory: notebook.contentFactory,
            mimeTypeService: notebook.mimeTypeService,
            editorConfig: notebook.editorConfig,
            notebookConfig: notebook.notebookConfig,
          })
        );

        let url: string | null = null;
        const originalOpen = window.open;
        window.open = (openedUrl) => {
          url = openedUrl?.toString() ?? null;
          return null;
        };

        try {
          await app.commands.execute('docmanager:open', {
            path: notebookPath,
            factory: 'Another view',
          });
        } finally {
          window.open = originalOpen;
        }

        return url;
      },
      { notebookPath: `${tmpPath}/${NOTEBOOK}` }
    );

    expect(openedUrl).not.toBeNull();
    const url = new URL(openedUrl!);
    expect(url.pathname).toContain('/notebooks/');
    expect(url.searchParams.get('factory')).toBe('Another view');
  });
});
