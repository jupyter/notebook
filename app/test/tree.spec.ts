// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { test, expect } from '@playwright/test';

import { BASE_URL } from './utils';

test('Tree', async ({ page }) => {
  await page.goto(`${BASE_URL}retro/tree`);
  const button = await page.$('text="New Notebook"');
  expect(button).toBeDefined();
});

test('should go to subfolder', async ({ page }) => {
  await page.goto(`${BASE_URL}retro/tree/binder`);

  expect(
    await page.waitForSelector('.jp-FileBrowser-crumbs >> text=/binder/')
  ).toBeTruthy();
});

test('should update url when navigating in filebrowser', async ({ page }) => {
  await page.goto(`${BASE_URL}retro/tree`);

  await page.dblclick('.jp-FileBrowser-listing >> text=binder');

  await page.waitForSelector('.jp-FileBrowser-crumbs >> text=/binder/');

  expect(page.url()).toEqual(`${BASE_URL}retro/tree/binder`);
});
