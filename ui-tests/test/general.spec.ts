// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { expect } from '@playwright/test';

import { test } from './fixtures';

import { waitForKernelReady } from './utils';

test.describe('General', () => {
  test('The notebook should render', async ({ page, tmpPath }) => {
    const notebook = 'simple.ipynb';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    // wait for the kernel status animations to be finished
    await waitForKernelReady(page);
    await page.waitForSelector(
      ".jp-Notebook-ExecutionIndicator[data-status='idle']"
    );

    // wait for the checkpoint indicator to be displayed
    await page.waitForSelector('.jp-NotebookCheckpoint');

    // force switching back to command mode to avoid capturing the cursor in the screenshot
    await page.evaluate(async () => {
      await window.jupyterapp.commands.execute('notebook:enter-command-mode');
    });

    expect(await page.screenshot()).toMatchSnapshot('notebook.png');
  });
});
