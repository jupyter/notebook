// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { test } from './fixtures';

import { expect } from '@jupyterlab/galata';

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
  tmpPath,
}) => {
  await page.contents.createDirectory(`${tmpPath}/${SUBFOLDER}`);

  await page.dblclick(`.jp-FileBrowser-listing >> text=${SUBFOLDER}`);

  await page.waitForSelector(`.jp-FileBrowser-crumbs >> text=/${SUBFOLDER}/`);

  const url = new URL(page.url());
  expect(url.pathname).toEqual(`/tree/${tmpPath}/${SUBFOLDER}`);
});

test('should not show a file load error when path contains notebooks', async ({
  page,
  tmpPath,
}) => {
  const nestedPath = `${tmpPath}/test/notebooks/test`;
  await page.contents.createDirectory(`${tmpPath}/test`);
  await page.contents.createDirectory(`${tmpPath}/test/notebooks`);
  await page.contents.createDirectory(nestedPath);

  await page.goto(`tree/${nestedPath}`);
  await page.waitForSelector('.jp-FileBrowser-crumbs >> text=/test/');

  await page.reload();
  await page.waitForSelector('.jp-FileBrowser-crumbs >> text=/test/');

  await expect(page.locator('text=File Load Error')).toHaveCount(0);
});

test('Should activate file browser tab', async ({ page, tmpPath }) => {
  await page.goto(`tree/${tmpPath}`);
  await page.locator('.jp-TreePanel >> text="Running"').click();

  await expect(
    page.locator('#main-panel #jp-running-sessions-tree')
  ).toBeVisible();

  await page.menu.clickMenuItem('View>File Browser');
  await expect(page.locator('#main-panel #filebrowser')).toBeVisible();
});
