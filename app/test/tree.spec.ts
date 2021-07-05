// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { test, expect } from '@playwright/test';

import { BASE_URL } from './utils';

test('Tree', async ({ page }) => {
  await page.goto(`${BASE_URL}retro/tree`);
  const button = await page.$('text="New Notebook"');
  expect(button).toBeDefined();
});
