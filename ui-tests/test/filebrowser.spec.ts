// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { expect } from '@jupyterlab/galata';

import { test } from './fixtures';

test.describe('File Browser', () => {
  test.beforeEach(async ({ page, tmpPath }) => {
    await page.contents.uploadFile(
      path.resolve(__dirname, './notebooks/empty.ipynb'),
      `${tmpPath}/empty.ipynb`
    );
    await page.contents.createDirectory(`${tmpPath}/folder1`);
    await page.contents.createDirectory(`${tmpPath}/folder2`);
  });

  test('Select one folder', async ({ page, tmpPath }) => {
    await page.filebrowser.refresh();

    await page.keyboard.down('Control');
    await page.getByText('folder1').last().click();

    const toolbar = page.getByRole('toolbar');

    expect(toolbar.getByText('Rename')).toBeVisible();
    expect(toolbar.getByText('Delete')).toBeVisible();
  });

  test('Select one file', async ({ page, tmpPath }) => {
    await page.filebrowser.refresh();

    await page.keyboard.down('Control');
    await page.getByText('empty.ipynb').last().click();

    const toolbar = page.getByRole('toolbar');

    ['Rename', 'Delete', 'Open', 'Download', 'Delete'].forEach(async (text) => {
      expect(toolbar.getByText(text)).toBeVisible();
    });
  });

  test('Select files and folders', async ({ page, tmpPath }) => {
    await page.filebrowser.refresh();

    await page.keyboard.down('Control');
    await page.getByText('folder1').last().click();
    await page.getByText('folder2').last().click();
    await page.getByText('empty.ipynb').last().click();

    const toolbar = page.getByRole('toolbar');

    expect(toolbar.getByText('Rename')).toBeHidden();
    expect(toolbar.getByText('Open')).toBeHidden();
    expect(toolbar.getByText('Delete')).toBeVisible();
  });

  test('Select files and open', async ({ page, tmpPath }) => {
    // upload an additional notebook
    await page.contents.uploadFile(
      path.resolve(__dirname, './notebooks/simple.ipynb'),
      `${tmpPath}/simple.ipynb`
    );
    await page.filebrowser.refresh();

    await page.keyboard.down('Control');
    await page.getByText('simple.ipynb').last().click();
    await page.getByText('empty.ipynb').last().click();

    const toolbar = page.getByRole('toolbar');

    const [nb1, nb2] = await Promise.all([
      page.waitForEvent('popup'),
      page.waitForEvent('popup'),
      toolbar.getByText('Open').last().click(),
    ]);

    await nb1.waitForLoadState();
    await nb1.close();

    await nb2.waitForLoadState();
    await nb2.close();
  });
});
