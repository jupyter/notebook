// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { test } from './fixtures';

import { expect } from '@playwright/test';

const NOTEBOOK = 'empty.ipynb';

const MENU_PATHS = [
  'File',
  'File>New',
  'Edit',
  'View',
  'Run',
  'Kernel',
  'Settings',
  'Settings>Theme',
  'Help'
];

test.use({ autoGoto: false });

test.describe('Notebook Menus', () => {
  test.beforeEach(async ({ page, tmpPath }) => {
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${NOTEBOOK}`),
      `${tmpPath}/${NOTEBOOK}`
    );
  });

  MENU_PATHS.forEach(menuPath => {
    test(`Open menu item ${menuPath}`, async ({ page, tmpPath }) => {
      await page.goto(`notebooks/${tmpPath}/${NOTEBOOK}`);
      await page.menu.open(menuPath);
      expect(await page.menu.isOpen(menuPath)).toBeTruthy();

      const imageName = `opened-menu-${menuPath.replace(/>/g, '-')}.png`;
      const menu = await page.menu.getOpenMenu();
      expect(await menu.screenshot()).toMatchSnapshot(imageName.toLowerCase());
    });
  });
});
