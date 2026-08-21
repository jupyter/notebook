// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { test } from './fixtures';

import { expect } from '@jupyterlab/galata';

const FILE = 'environment.yml';
const NOTEBOOK = 'empty.ipynb';

test.use({ autoGoto: false });

const processRenameDialog = async (page, prevName: string, newName: string) => {
  // Rename in the input dialog
  await page
    .locator(`text=File Path${prevName}New Name >> input`)
    .fill(newName);

  await Promise.all([
    await page.click('text="Rename"'),
    // wait until the URL is updated
    await page.waitForNavigation(),
  ]);
};

test.describe('Editor', () => {
  test.beforeEach(async ({ page, tmpPath }) => {
    await page.contents.uploadFile(
      path.resolve(__dirname, `../../binder/${FILE}`),
      `${tmpPath}/${FILE}`
    );
  });

  test('Should not render cell toolbar in file editor', async ({
    page,
    tmpPath,
  }) => {
    const file = `${tmpPath}/${FILE}`;
    await page.goto(`edit/${file}`);

    await expect(page.locator('.cm-editor')).toBeVisible();
    await expect(page.locator('.jp-cell-toolbar')).toHaveCount(0);
  });

  test('Renaming the file by clicking on the title', async ({
    page,
    tmpPath,
  }) => {
    const file = `${tmpPath}/${FILE}`;
    await page.goto(`edit/${file}`);

    // Click on the title
    await page.click(`text="${FILE}"`);

    const newName = 'test.yml';
    await processRenameDialog(page, FILE, newName);

    // Check the URL contains the new name
    const url = page.url();
    expect(url).toContain(newName);
  });

  test('Should open a notebook in the text editor with factory query arg', async ({
    page,
    tmpPath,
  }) => {
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${NOTEBOOK}`),
      `${tmpPath}/${NOTEBOOK}`
    );
    await page.goto(`edit/${tmpPath}/${NOTEBOOK}?factory=Editor`);

    await expect(page.locator('.cm-editor')).toBeVisible();
    await expect(page.locator('.jp-Notebook')).toHaveCount(0);
  });

  test('Should take a screenshot of the file editor', async ({
    page,
    tmpPath,
  }) => {
    const file = `${tmpPath}/${FILE}`;
    await page.goto(`edit/${file}`);

    await expect(page.locator('.cm-editor')).toBeVisible();
    // wait for the file content to be rendered in the editor
    await expect(page.locator('.cm-content')).toContainText('name: notebook');

    // normalize the checkpoint indicator in the top bar since it may display
    // dynamic strings such as "Last Checkpoint: 3 seconds ago"
    await page
      .locator('.jp-NotebookCheckpoint')
      .evaluate((element) => (element.innerHTML = ''));

    // the editor might sometimes be focused after load, so blur it and hide
    // the cursor layer to avoid capturing a blinking cursor in the screenshot
    await page
      .locator('.cm-content')
      .evaluate((element) => (element as HTMLElement).blur());
    await page
      .locator('.cm-cursorLayer')
      .evaluate((element) => (element.style.display = 'none'));

    expect(await page.screenshot()).toMatchSnapshot('file-editor.png');
  });

  test('Should not render the micro toolbar for files', async ({
    page,
    tmpPath,
  }) => {
    const file = `${tmpPath}/${FILE}`;
    await page.goto(`edit/${file}`);

    await expect(page.locator('.cm-editor')).toBeVisible();

    // the micro toolbar is added to the DOM but should be hidden via CSS
    const microToolbar = page.locator('.jp-MainAreaWidget > .jp-Toolbar-micro');
    await expect(microToolbar).toHaveCount(1);
    await expect(microToolbar).toBeHidden();
  });

  test('Renaming the file via the menu entry', async ({ page, tmpPath }) => {
    const file = `${tmpPath}/${FILE}`;
    await page.goto(`edit/${file}`);

    // Click on the title
    await page.menu.clickMenuItem('File>Rename…');

    // Rename in the input dialog
    const newName = 'test.yml';

    await processRenameDialog(page, FILE, newName);

    // Check the URL contains the new name
    const url = page.url();
    expect(url).toContain(newName);
  });
});
