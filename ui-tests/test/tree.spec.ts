// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { test } from './fixtures';

import { expect } from '@playwright/test';

const SUBFOLDER = 'subfolder';

test('Tree', async ({ page }) => {
  await page.goto('tree');
  const button = await page.$('text="New Notebook"');
  expect(button).toBeDefined();
});

test('should go to subfolder', async ({ page, tmpPath }) => {
  const dir = `${tmpPath}/${SUBFOLDER}`;
  await page.contents.createDirectory(dir);
  await page.goto(`tree/${dir}`);

  expect(
    await page.waitForSelector(`.jp-FileBrowser-crumbs >> text=/${SUBFOLDER}/`)
  ).toBeTruthy();
});

test('should update url when navigating in filebrowser', async ({
  page,
  tmpPath
}) => {
  await page.contents.createDirectory(`${tmpPath}/${SUBFOLDER}`);

  await page.dblclick(`.jp-FileBrowser-listing >> text=${SUBFOLDER}`);

  await page.waitForSelector(`.jp-FileBrowser-crumbs >> text=/${SUBFOLDER}/`);

  const url = new URL(page.url());
  expect(url.pathname).toEqual(`/tree/${tmpPath}/${SUBFOLDER}`);
});
