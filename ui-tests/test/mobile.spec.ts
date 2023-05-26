// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { expect } from '@playwright/test';

import { test } from './fixtures';

import { hideAddCellButton, waitForKernelReady } from './utils';

test.use({ autoGoto: false, viewport: { width: 524, height: 800 } });

test.describe('Mobile', () => {
  test('The layout should be more compact on the file browser page', async ({
    page,
    tmpPath,
  }) => {
    await page.goto(`tree/${tmpPath}`);

    await page.waitForSelector('#top-panel-wrapper', { state: 'hidden' });

    expect(await page.screenshot()).toMatchSnapshot('tree.png');
  });

  test('The layout should be more compact on the notebook page', async ({
    page,
    tmpPath,
    browserName,
  }) => {
    const notebook = 'empty.ipynb';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    // wait for the kernel status animations to be finished
    await waitForKernelReady(page);

    // force switching back to command mode to avoid capturing the cursor in the screenshot
    await page.evaluate(async () => {
      await window.jupyterapp.commands.execute('notebook:enter-command-mode');
    });

    // TODO: remove
    if (browserName === 'firefox') {
      await hideAddCellButton(page);
    }

    expect(await page.screenshot()).toMatchSnapshot('notebook.png');
  });
});
