// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { expect } from '@playwright/test';

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

    const [current] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByText('Current Directory').last().click(),
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
});
