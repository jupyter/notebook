// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { test } from './fixtures';

import { expect } from '@playwright/test';

test.use({ autoGoto: false });

test.describe('Settings', () => {
  test('Should be persisted after reloading the page', async ({
    page,
    tmpPath
  }) => {
    const showHeaderPath = 'View>Show Header';

    await page.goto(`tree/${tmpPath}`);

    await page.menu.clickMenuItem(showHeaderPath);
    await page.reload({ waitUntil: 'networkidle' });

    await page.menu.getMenuItem(showHeaderPath);
    expect(await page.screenshot()).toMatchSnapshot('top-hidden.png');

    await page.menu.clickMenuItem(showHeaderPath);
    await page.reload({ waitUntil: 'networkidle' });

    await page.menu.getMenuItem(showHeaderPath);
    expect(await page.screenshot()).toMatchSnapshot('top-visible.png');
  });
});
