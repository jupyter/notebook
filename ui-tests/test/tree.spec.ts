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

test.describe('Toolbar New dropdown', () => {
  test('New > New Folder should create a new folder', async ({
    page,
    tmpPath,
  }) => {
    await page.click('.jp-DropdownMenu >> text="New"');
    await page.click(
      '.lm-Menu [data-command="filebrowser:create-new-directory"]'
    );

    // the new folder is created in inline-rename mode, commit the default name
    await page.waitForSelector('.jp-DirListing-editor');
    await page.keyboard.press('Enter');

    await expect(
      page.locator('.jp-DirListing-item >> text="Untitled Folder"')
    ).toBeVisible();
    expect(
      await page.contents.directoryExists(`${tmpPath}/Untitled Folder`)
    ).toBe(true);
  });

  test('New > New File should create a new file', async ({ page, tmpPath }) => {
    await page.click('.jp-DropdownMenu >> text="New"');
    await page.click('.lm-Menu [data-command="filebrowser:create-new-file"]');

    // the new file is created in inline-rename mode, commit the default name
    await page.waitForSelector('.jp-DirListing-editor');
    await page.keyboard.press('Enter');

    await expect(
      page.locator('.jp-DirListing-item >> text="untitled.txt"')
    ).toBeVisible();
    expect(await page.contents.fileExists(`${tmpPath}/untitled.txt`)).toBe(
      true
    );
  });

  test('New > Console should open a new console', async ({ page }) => {
    await page.click('.jp-DropdownMenu >> text="New"');
    await page.click('.lm-Menu [data-command="console:create"]');

    // choose the default kernel in the kernel selection dialog
    const [consolePage] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('.jp-Dialog >> text="Select"'),
    ]);
    await consolePage.waitForLoadState();

    expect(new URL(consolePage.url()).pathname).toContain('/consoles/');
    await consolePage.waitForSelector('.jp-CodeConsole');
    await consolePage.close();
  });
});
