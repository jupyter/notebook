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

test('should create a terminal in the current directory', async ({
  page,
  tmpPath,
}) => {
  const dir = `${tmpPath}/${SUBFOLDER}`;
  const marker = 'terminal-cwd.txt';
  await page.contents.createDirectory(dir);
  await page.filebrowser.refresh();
  await page.dblclick(`.jp-FileBrowser-listing >> text=${SUBFOLDER}`);
  await page.waitForSelector(`.jp-FileBrowser-crumbs >> text=/${SUBFOLDER}/`);

  const [terminal] = await Promise.all([
    page.waitForEvent('popup'),
    page.menu.clickMenuItem('New>Terminal'),
  ]);

  const terminalPanel = terminal.locator('.jp-Terminal');
  await terminalPanel.waitFor();
  await terminalPanel.locator('.xterm-screen').click();
  const input = terminalPanel.locator('[aria-label="Terminal input"]');
  await input.waitFor({ state: 'attached' });
  await expect(input).toBeFocused();
  await terminal.keyboard.type(`pwd > ${marker}`);
  await terminal.keyboard.press('Enter');

  const markerItem = page.locator(`.jp-FileBrowser-listing >> text=${marker}`);
  await expect
    .poll(
      async () => {
        await page.filebrowser.refresh();
        return markerItem.count();
      },
      { timeout: 10_000 }
    )
    .toBeGreaterThan(0);
  await terminal.close();
});

test('Should redirect from notebooks route to tree route for directories', async ({
  page,
  tmpPath,
}) => {
  const dir = `${tmpPath}/${SUBFOLDER}`;
  await page.contents.createDirectory(dir);

  // Navigate to the directory via the /notebooks/ route
  await page.goto(`notebooks/${dir}`);

  // Should redirect to /tree/ since the path is a directory
  await page.waitForURL(`**/tree/${dir}`);
  const url = new URL(page.url());
  expect(url.pathname).toEqual(`/tree/${dir}`);
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
