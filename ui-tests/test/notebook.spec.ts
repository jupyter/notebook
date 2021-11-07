// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { test } from './fixtures';

import { expect } from '@playwright/test';

const NOTEBOOK = 'example.ipynb';

test.use({ autoGoto: false });

test.describe('Notebook', () => {
  test.beforeEach(async ({ page, tmpPath }) => {
    await page.contents.uploadFile(
      path.resolve(__dirname, `../../binder/${NOTEBOOK}`),
      `${tmpPath}/${NOTEBOOK}`
    );
  });

  test('Title should be rendered', async ({ page, tmpPath }) => {
    await page.goto(`notebooks/${tmpPath}/${NOTEBOOK}`);
    const href = await page.evaluate(() => {
      return document.querySelector('#jp-RetroLogo')?.getAttribute('href');
    });
    expect(href).toContain('/retro/tree');
  });

  test('Renaming the notebook should be possible', async ({
    page,
    tmpPath
  }) => {
    const notebook = `${tmpPath}/${NOTEBOOK}`;
    await page.goto(`notebooks/${notebook}`);

    // Click on the title
    await page.click('text="example.ipynb"');

    // Rename in the input dialog
    const newName = 'test.ipynb';
    await page.fill(
      `//div[normalize-space(.)='File Path${notebook}New Name']/input`,
      newName
    );

    await Promise.all([
      await page.click('text="Rename"'),
      // wait until the URL is updated
      await page.waitForNavigation()
    ]);

    // Check the URL contains the new name
    const url = page.url();
    expect(url).toContain(newName);
  });
});
