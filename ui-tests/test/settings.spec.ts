// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { test } from './fixtures';

import { expect, galata } from '@jupyterlab/galata';

// Set a fixed string as Playwright is preventing the unique test name to be too long
// and replaces part of the path with a hash
test.use({ autoGoto: false, tmpPath: 'settings' });

test.describe('Settings', () => {
  test.beforeAll(async ({ request, tmpPath }) => {
    const contents = galata.newContentsHelper(request);
    await contents.createDirectory(tmpPath);
  });

  test.afterAll(async ({ request, tmpPath }) => {
    const contents = galata.newContentsHelper(request);
    await contents.deleteDirectory(tmpPath);
  });

  test('Should be persisted after reloading the page', async ({
    page,
    tmpPath,
  }) => {
    const showHeaderPath = 'View>Show Header';
    const topPanel = page.locator('#top-panel-wrapper');
    const fileSizeColumn = page.locator(
      '#filebrowser .jp-DirListing-header .jp-id-filesize'
    );

    await page.goto(`tree/${tmpPath}`);

    await expect(topPanel).toBeVisible();
    await page.menu.clickMenuItem(showHeaderPath);
    await expect(topPanel).toBeHidden();
    await page.reload({ waitUntil: 'networkidle' });
    await expect(topPanel).toBeAttached();
    await expect(topPanel).toBeHidden();
    await expect(fileSizeColumn).toBeVisible();
    await expect.soft(page).toHaveScreenshot('top-hidden.png', {
      maxDiffPixels: 400,
    });

    await page.menu.clickMenuItem(showHeaderPath);
    await expect(topPanel).toBeVisible();
    await page.reload({ waitUntil: 'networkidle' });
    await expect(topPanel).toBeVisible();
    await expect(fileSizeColumn).toBeVisible();
    await expect(page).toHaveScreenshot('top-visible.png', {
      maxDiffPixels: 400,
    });
  });
});
