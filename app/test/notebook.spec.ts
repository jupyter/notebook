// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import fs from 'fs';

import path from 'path';

import rimraf from 'rimraf';

import { test, expect } from '@playwright/test';

import { BASE_URL } from './utils';

const NOTEBOOK_PATH = 'app/test/data/example.ipynb';
const NOTEBOOK_URL = `${BASE_URL}retro/notebooks/${NOTEBOOK_PATH}`;

test.beforeAll(async () => {
  const data = path.join(__dirname, './data');
  const example = path.join(__dirname, '../../binder/example.ipynb');
  const dest = path.join(data, 'example.ipynb');

  rimraf.sync(data);
  fs.mkdirSync(data);
  fs.copyFileSync(example, dest);
});

test.describe('Notebook', () => {
  test('Title should be rendered', async ({ page }) => {
    await page.goto(NOTEBOOK_URL);
    await page.waitForTimeout(2000);
    const href = await page.evaluate(() => {
      return document.querySelector('#jp-RetroLogo')?.getAttribute('href');
    });
    expect(href).toContain('/retro/tree');
  });

  test('Renaming the notebook should be possible', async ({ page }) => {
    await page.goto(NOTEBOOK_URL);

    // Click on the title
    await page.click('text="example.ipynb"');

    // Rename in the input dialog
    const newName = 'test.ipynb';
    await page.fill(
      `//div[normalize-space(.)='File Path${NOTEBOOK_PATH}New Name']/input`,
      newName
    );
    await page.click('text="Rename"');
    await page.waitForNavigation();

    // Check the URL contains the new name
    const url = page.url();
    expect(url).toContain(newName);
  });
});
