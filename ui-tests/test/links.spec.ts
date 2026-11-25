// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { expect } from '@jupyterlab/galata';

import { test } from './fixtures';

const NOTEBOOK = 'local_links.ipynb';
const SUBFOLDER = 'test';

test.describe('Local Links', () => {
  test.beforeEach(async ({ page, tmpPath }) => {
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${NOTEBOOK}`),
      `${tmpPath}/${NOTEBOOK}`
    );
  });

  test('Open the current directory', async ({ page, tmpPath }) => {
    await page.goto(`notebooks/${tmpPath}/${NOTEBOOK}`);

    const currentDirectoryLink = page
      .getByRole('link', { name: 'Current Directory', exact: true })
      .last();
    await expect(currentDirectoryLink).toHaveAttribute('href', /\/files\//);

    const [current] = await Promise.all([
      page.waitForEvent('popup'),
      currentDirectoryLink.click(),
    ]);

    await current.waitForLoadState();
    await current.waitForSelector('.jp-DirListing-content');

    // Check that the link opened in a new tab
    expect(current.url()).toContain(`tree/${tmpPath}`);
    await current.close();
  });

  test('Open a folder', async ({ page, tmpPath }) => {
    // Create a test folder
    await page.contents.createDirectory(`${tmpPath}/${SUBFOLDER}`);

    await page.goto(`notebooks/${tmpPath}/${NOTEBOOK}`);

    const [folder] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByText('Open Test Folder').last().click(),
    ]);

    await folder.waitForLoadState();
    await folder.waitForSelector('.jp-DirListing-content');

    await folder.close();

    // Check that the link opened in a new tab
    expect(folder.url()).toContain(`tree/${tmpPath}/${SUBFOLDER}`);
  });

  test('Show an error for a missing file', async ({ page, tmpPath }) => {
    await page.goto(`notebooks/${tmpPath}/${NOTEBOOK}`);

    await page.getByText('Missing File').last().click();

    const dialog = page.locator('.jp-Dialog');
    await expect(dialog).toContainText('Cannot open');
    await expect(dialog).toContainText('Could not find path');
  });
});
