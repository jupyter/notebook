// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { expect, galata } from '@jupyterlab/galata';

import { test } from './fixtures';

test.describe('File Browser', () => {
  test.beforeEach(async ({ page, tmpPath }) => {
    await page.contents.uploadFile(
      path.resolve(__dirname, './notebooks/empty.ipynb'),
      `${tmpPath}/empty.ipynb`
    );
    await page.contents.createDirectory(`${tmpPath}/folder1`);
    await page.contents.createDirectory(`${tmpPath}/folder2`);
  });

  test('Select one folder', async ({ page, tmpPath }) => {
    await page.filebrowser.refresh();

    await page.keyboard.down('Control');
    await page.getByText('folder1').last().click();

    const toolbar = page.getByRole('toolbar');

    expect(toolbar.getByText('Rename')).toBeVisible();
    expect(toolbar.getByText('Move to Trash')).toBeVisible();
  });

  test('Select one file', async ({ page, tmpPath }) => {
    await page.filebrowser.refresh();

    await page.keyboard.down('Control');
    await page.getByText('empty.ipynb').last().click();

    const toolbar = page.getByRole('toolbar');

    ['Rename', 'Open', 'Download', 'Move to Trash'].forEach(async (text) => {
      expect(toolbar.getByText(text)).toBeVisible();
    });
  });

  test('Select files and folders', async ({ page, tmpPath }) => {
    await page.filebrowser.refresh();

    await page.keyboard.down('Control');
    await page.getByText('folder1').last().click();
    await page.getByText('folder2').last().click();
    await page.getByText('empty.ipynb').last().click();

    const toolbar = page.getByRole('toolbar');

    expect(toolbar.getByText('Rename')).toBeHidden();
    expect(toolbar.getByText('Open')).toBeHidden();
    expect(toolbar.getByText('Move to Trash')).toBeVisible();
  });

  test('Select files and open', async ({ page, tmpPath }) => {
    // upload an additional notebook
    await page.contents.uploadFile(
      path.resolve(__dirname, './notebooks/simple.ipynb'),
      `${tmpPath}/simple.ipynb`
    );
    await page.filebrowser.refresh();

    await page.keyboard.down('Control');
    await page.getByText('simple.ipynb').last().click();
    await page.getByText('empty.ipynb').last().click();

    const toolbar = page.getByRole('toolbar');

    const [nb1, nb2] = await Promise.all([
      page.waitForEvent('popup'),
      page.waitForEvent('popup'),
      toolbar.getByText('Open').last().click(),
    ]);

    await nb1.waitForLoadState();
    await nb1.close();

    await nb2.waitForLoadState();
    await nb2.close();
  });

  test('Open a file from its path', async ({ page, tmpPath }) => {
    await page.filebrowser.refresh();

    await page.getByRole('menuitem', { name: 'File' }).click();
    await page.getByRole('menuitem', { name: 'Open from Path' }).click();

    const dialog = page.locator('.jp-Dialog');
    await dialog.getByRole('textbox').fill(`${tmpPath}/empty.ipynb`);

    const [notebook] = await Promise.all([
      page.waitForEvent('popup'),
      dialog.getByRole('button', { name: 'Open' }).click(),
    ]);

    await notebook.waitForLoadState();
    expect(notebook.url()).toContain(`${tmpPath}/empty.ipynb`);
    await notebook.close();
  });

  test('Show the Upload button in the toolbar by default', async ({ page }) => {
    const toolbar = page.locator('.jp-FileBrowser-toolbar');

    await expect(toolbar.getByText('Upload')).toBeVisible();
  });

  test('Filter the file browser listing with the file filter', async ({
    page,
  }) => {
    await page.filebrowser.refresh();

    const toggleButton = page.locator(
      'jp-button[data-command="filebrowser:toggle-file-filter"]'
    );
    const filterInput = page.locator('.jp-FileBrowser-filterBox input');
    const listing = page.locator('.jp-DirListing-item');

    // the file filter input is hidden by default
    await expect(filterInput).toBeHidden();
    await expect(listing).toHaveCount(3);

    // clicking the toggle button shows the filter input
    await toggleButton.click();
    await expect(filterInput).toBeVisible();

    // typing a query narrows down the listing
    await filterInput.fill('folder1');
    await expect(listing).toHaveCount(1);
    await expect(listing).toHaveText(/folder1/);

    // clicking the toggle button again hides the filter input and restores
    // the full listing
    await toggleButton.click();
    await expect(filterInput).toBeHidden();
    await expect(listing).toHaveCount(3);
  });

  test('Toggle the Date Created column from the header context menu', async ({
    page,
  }) => {
    await page.filebrowser.refresh();

    const header = page.locator('.jp-DirListing-header');
    const dateCreatedColumn = header.locator('.jp-id-created');
    await expect(dateCreatedColumn).toBeHidden();

    await header.click({ button: 'right' });
    await page.getByText('Show Date Created Column').click();

    await expect(dateCreatedColumn).toBeVisible();
  });
});

test.describe('File Browser settings', () => {
  test.use({
    mockSettings: {
      ...galata.DEFAULT_SETTINGS,
      '@jupyterlab/filebrowser-extension:browser': {
        showDateCreatedColumn: true,
      },
    },
  });

  test('Should show the Date Created column when enabled in the settings', async ({
    page,
  }) => {
    await page.filebrowser.refresh();

    const header = page.locator('.jp-DirListing-header');
    await expect(header.locator('.jp-id-created')).toBeVisible();
  });
});

test.describe('File Browser toolbar settings', () => {
  test.use({
    mockSettings: {
      ...galata.DEFAULT_SETTINGS,
      '@jupyter-notebook/tree-extension:widget': {
        toolbar: [
          {
            name: 'uploader',
            disabled: true,
          },
        ],
      },
    },
  });

  test('Should hide the Upload button when disabled in the settings', async ({
    page,
  }) => {
    const toolbar = page.locator('.jp-FileBrowser-toolbar');

    // other toolbar items should still be visible
    await expect(toolbar.getByText('New', { exact: true })).toBeVisible();
    await expect(
      toolbar.locator('[data-jp-item-name="refresh"]')
    ).toBeVisible();

    // the Upload button should not be added to the toolbar
    await expect(toolbar.locator('[data-jp-item-name="uploader"]')).toHaveCount(
      0
    );
  });
});
