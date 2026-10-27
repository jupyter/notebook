// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { test } from './fixtures';

import { expect } from '@jupyterlab/galata';

import { waitForKernelReady } from './utils';

const NOTEBOOK = 'empty.ipynb';

const MENU_PATHS = [
  'File',
  'File>New',
  'File>Save and Export Notebook As',
  'Edit',
  'View',
  'Run',
  'Kernel',
  'Settings',
  'Settings>Theme',
  'Help',
];

test.use({ autoGoto: false });

test.describe('Notebook Menus', () => {
  test.beforeEach(async ({ page, tmpPath }) => {
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${NOTEBOOK}`),
      `${tmpPath}/${NOTEBOOK}`
    );
  });

  MENU_PATHS.forEach((menuPath) => {
    test(`Open menu item ${menuPath}`, async ({ page, tmpPath }) => {
      if (menuPath === 'File>Save and Export Notebook As') {
        // nbconvert discovers exporters on the server. This serialized work
        // can take longer while other workers are opening notebooks too.
        test.slow();
      }
      await page.goto(`notebooks/${tmpPath}/${NOTEBOOK}`);
      await waitForKernelReady(page);

      if (menuPath === 'File>Save and Export Notebook As') {
        // Export formats are requested lazily when the notebook opens. Opening
        // the submenu before that request resolves produces an empty menu.
        await page.evaluate(async () => {
          await window.jupyterapp.serviceManager.nbconvert.getExportFormats(
            false
          );
        });
      }

      await page.menu.openLocator(menuPath);
      expect(await page.menu.isOpen(menuPath)).toBeTruthy();

      const imageName = `opened-menu-${menuPath.replace(/>/g, '-')}.png`;
      // Export formats load asynchronously and can replace the submenu DOM.
      // A locator reacquires the visible menu instead of retaining a stale handle.
      const menu = page.locator('.lm-Menu:visible .lm-Menu-content').last();
      await expect(menu).toBeVisible();
      await expect(menu).toHaveScreenshot(imageName.toLowerCase());
    });
  });

  test('View menu should not have the Text Editor Syntax Highlighting entry', async ({
    page,
    tmpPath,
  }) => {
    await page.goto(`notebooks/${tmpPath}/${NOTEBOOK}`);
    await waitForKernelReady(page);

    await page.menu.open('View');
    expect(
      await page.menu.isOpen('View>Text Editor Syntax Highlighting')
    ).toBeFalsy();
  });
});
