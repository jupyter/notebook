// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { IJupyterLabPage, expect, galata } from '@jupyterlab/galata';

import { test } from './fixtures';

import { hideAddCellButton, waitForKernelReady } from './utils';

test.use({
  autoGoto: false,
  viewport: { width: 524, height: 800 },
  // Set a fixed string as Playwright is preventing the unique test name to be too long
  // and replaces part of the path with a hash
  tmpPath: 'mobile-layout',
});

test.describe('Mobile', () => {
  // manually create the test directory since tmpPath is set to a fixed value
  test.beforeAll(async ({ request, tmpPath }) => {
    const contents = galata.newContentsHelper(request);
    await contents.createDirectory(tmpPath);
  });

  test.afterAll(async ({ request, tmpPath }) => {
    const contents = galata.newContentsHelper(request);
    await contents.deleteDirectory(tmpPath);
  });

  test('The layout should be more compact on the file browser page', async ({
    page,
    tmpPath,
  }) => {
    await page.goto(`tree/${tmpPath}`);

    await page.waitForSelector('#top-panel-wrapper', { state: 'hidden' });

    expect(await page.screenshot()).toMatchSnapshot('tree.png', {
      maxDiffPixels: 300,
    });
  });

  test('The layout should be more compact on the notebook page', async ({
    page,
    tmpPath,
    browserName,
  }) => {
    await page.goto(`tree/${tmpPath}`);

    // Create a new notebook
    const notebookPromise = page.waitForEvent('popup');
    await page.click('text="New"');
    await page
      .locator(
        '[data-command="notebook:create-new"] >> text="Python 3 (ipykernel)"'
      )
      .click();
    const notebook = await notebookPromise;

    // wait for the kernel status animations to be finished
    await waitForKernelReady(notebook);

    // force switching back to command mode to avoid capturing the cursor in the screenshot
    await notebook.evaluate(async () => {
      await window.jupyterapp.commands.execute('notebook:enter-command-mode');
    });

    // TODO: remove
    if (browserName === 'firefox') {
      await hideAddCellButton(notebook);
    }

    expect(await notebook.screenshot()).toMatchSnapshot('notebook.png');
    await notebook.close();
  });
});
