// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { expect } from '@jupyterlab/galata';

import { test } from './fixtures';

import { waitForKernelReady } from './utils';

test.use({ autoGoto: false });

test.describe('Top bar', () => {
  test('Kernel logo should be displayed with the kernel name', async ({
    page,
    tmpPath,
  }) => {
    const notebook = 'empty.ipynb';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    await waitForKernelReady(page);

    const logo = page.locator('.jp-NotebookKernelLogo img');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('src', /kernelspecs/);
    await expect(logo).toHaveAttribute('title', 'Python 3 (ipykernel)');
  });

  test('Checkpoint indicator should be updated after saving the notebook', async ({
    page,
    tmpPath,
  }) => {
    const notebook = 'empty.ipynb';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    await waitForKernelReady(page);

    // a freshly uploaded notebook does not have a checkpoint yet,
    // so the indicator should be empty
    const checkpoint = page.locator('.jp-NotebookCheckpoint');
    await expect(checkpoint).toHaveText('');

    // make an edit to the notebook
    await page.click('.jp-Cell-inputArea');
    await page
      .locator(
        '.jp-Cell-inputArea >> .cm-editor >> .cm-content[contenteditable="true"]'
      )
      .type('1 + 1');

    // save the notebook, which also creates a checkpoint
    await page.keyboard.press('Escape');
    await page.keyboard.press('ControlOrMeta+S');

    // the indicator is refreshed shortly after the save
    await expect(checkpoint).toContainText('Last Checkpoint:', {
      timeout: 10000,
    });
  });

  test('A notebook with code cells should not be trusted by default', async ({
    page,
    tmpPath,
  }) => {
    // empty.ipynb contains a code cell
    const notebook = 'empty.ipynb';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    await waitForKernelReady(page);

    const trustedButton = page.locator('button.jp-NotebookTrustedStatus');
    await expect(trustedButton).toHaveText('Not Trusted');

    // clicking on the button should open a confirmation dialog to trust the notebook
    await trustedButton.click();
    const dialog = page.locator('.jp-Dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Trust this notebook?');

    // accepting the dialog should trust the notebook
    await dialog.locator('.jp-Dialog-button.jp-mod-accept').click();
    await expect(trustedButton).toHaveText('Trusted');
  });

  test('A notebook without code cells should be trusted', async ({
    page,
    tmpPath,
  }) => {
    // simple.ipynb only contains a markdown cell
    const notebook = 'simple.ipynb';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    await waitForKernelReady(page);

    const trustedButton = page.locator('button.jp-NotebookTrustedStatus');
    await expect(trustedButton).toHaveText('Trusted');
  });
});
