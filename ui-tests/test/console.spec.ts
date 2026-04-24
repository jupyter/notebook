// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { expect } from '@jupyterlab/galata';

import { Locator } from '@playwright/test';

import path from 'path';

import { test } from './fixtures';

import { waitForNotebook } from './utils';

const NOTEBOOK = 'empty.ipynb';

test.use({ autoGoto: false });

test.describe('ScratchPad', () => {
  test.beforeEach(async ({ page, tmpPath }) => {
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${NOTEBOOK}`),
      `${tmpPath}/${NOTEBOOK}`
    );
  });

  test('Should not have a menu entry in tree', async ({ page }) => {
    await page.goto('tree');
    const menu = (await page.menu.openLocator('File>New')) as Locator;
    const entry = menu.getByText('Scratchpad console');
    expect(entry).not.toBeVisible();
  });

  test('Should have a menu entry in Notebook', async ({ page, tmpPath }) => {
    await page.goto(`notebooks/${tmpPath}/${NOTEBOOK}`);
    const menu = (await page.menu.openLocator('File>New')) as Locator;
    const entry = menu.getByText('Scratchpad console');
    expect(entry).toBeVisible();
  });

  test('Should open scratchpad console with menu', async ({
    page,
    tmpPath,
  }) => {
    await page.goto(`notebooks/${tmpPath}/${NOTEBOOK}`);
    const menu = (await page.menu.openLocator('File>New')) as Locator;
    await menu.getByText('Scratchpad console').click();

    const rightStack = page.locator('#jp-right-stack');
    await expect(rightStack).toBeVisible();
    await expect(rightStack.locator('.jp-ConsolePanel')).toBeVisible();
  });

  test('Should open scratchpad console with shortcut', async ({
    page,
    tmpPath,
  }) => {
    await page.goto(`notebooks/${tmpPath}/${NOTEBOOK}`);
    await page.locator('body').press('Control+B');

    const rightStack = page.locator('#jp-right-stack');
    await expect(rightStack).toBeVisible();
    await expect(rightStack.locator('.jp-ConsolePanel')).toBeVisible();
  });

  test('Scratch pad console should use the notebook kernel', async ({
    page,
    tmpPath,
    browserName,
  }) => {
    await page.goto(`notebooks/${tmpPath}/${NOTEBOOK}`);
    await waitForNotebook(page, browserName);
    const cellInput = page
      .locator(
        '.jp-Notebook-cell >> .jp-Cell-inputArea >> .cm-editor >> .cm-content[contenteditable="true"]'
      )
      .first();
    await cellInput.fill('a = 1');
    await cellInput.press('Shift+Enter');

    await page.locator('body').press('Control+B');

    const console = page.locator('#jp-right-stack .jp-ConsolePanel');

    const input = console.locator(
      '.jp-CodeConsole-input >> .cm-editor >> .cm-content[contenteditable="true"]'
    );
    await input.fill('print(a)');
    await input.press('Shift+Enter');

    const output = console.locator('.jp-OutputArea-output').first();
    await expect(output).toHaveText('1');
  });
});
