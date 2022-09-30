// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { test } from './fixtures';

import { expect } from '@playwright/test';

const FILE = 'environment.yml';

test.use({ autoGoto: false });

const processRenameDialog = async (page, prevName: string, newName: string) => {
  // Rename in the input dialog
  await page
    .locator(`text=File Path${prevName}New Name >> input`)
    .fill(newName);

  await Promise.all([
    await page.click('text="Rename"'),
    // wait until the URL is updated
    await page.waitForNavigation()
  ]);
};

test.describe('Editor', () => {
  test.beforeEach(async ({ page, tmpPath }) => {
    await page.contents.uploadFile(
      path.resolve(__dirname, `../../binder/${FILE}`),
      `${tmpPath}/${FILE}`
    );
  });

  test('Renaming the file by clicking on the title', async ({
    page,
    tmpPath
  }) => {
    const file = `${tmpPath}/${FILE}`;
    await page.goto(`edit/${file}`);

    // Click on the title
    await page.click(`text="${FILE}"`);

    const newName = 'test.yml';
    await processRenameDialog(page, FILE, newName);

    // Check the URL contains the new name
    const url = page.url();
    expect(url).toContain(newName);
  });

  test('Renaming the file via the menu entry', async ({ page, tmpPath }) => {
    const file = `${tmpPath}/${FILE}`;
    await page.goto(`edit/${file}`);

    // Click on the title
    await page.menu.clickMenuItem('File>Rename…');

    // Rename in the input dialog
    const newName = 'test.yml';

    await processRenameDialog(page, FILE, newName);

    // Check the URL contains the new name
    const url = page.url();
    expect(url).toContain(newName);
  });
});
