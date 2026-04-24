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

    await page.goto(`tree/${tmpPath}`);

    await page.waitForSelector('#top-panel', { state: 'visible' });
    await page.menu.clickMenuItem(showHeaderPath);
    await page.waitForSelector('#top-panel', { state: 'hidden' });
    await page.reload({ waitUntil: 'networkidle' });
    await page.menu.getMenuItem(showHeaderPath);
    expect(await page.screenshot()).toMatchSnapshot('top-hidden.png', {
      maxDiffPixels: 300,
    });

    await page.waitForSelector('#top-panel', { state: 'hidden' });
    await page.menu.clickMenuItem(showHeaderPath);
    await page.waitForSelector('#top-panel', { state: 'visible' });
    await page.reload({ waitUntil: 'networkidle' });
    await page.menu.getMenuItem(showHeaderPath);
    expect(await page.screenshot()).toMatchSnapshot('top-visible.png', {
      maxDiffPixels: 300,
    });
  });
});
