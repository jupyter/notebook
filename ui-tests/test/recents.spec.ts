// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { expect, IJupyterLabPageFixture } from '@jupyterlab/galata';

import { Locator } from '@playwright/test';

import { test } from './fixtures';

import { waitForNotebook } from './utils';

const NOTEBOOK = 'simple.ipynb';

test.use({ autoGoto: false });

/**
 * Open the "Recents" tab in the tree view and wait for its panel to be visible.
 */
async function openRecentsTab(page: IJupyterLabPageFixture): Promise<void> {
  await page.locator('.jp-TreePanel >> text="Recents"').click();
  await expect(page.locator('#main-panel #jp-recents-tree')).toBeVisible();
}

test.describe('Recents', () => {
  test('should show the Recents tab in the tree view', async ({
    page,
    tmpPath,
  }) => {
    await page.goto(`tree/${tmpPath}`);

    await expect(page.locator('.jp-TreePanel >> text="Recents"')).toBeVisible();

    await openRecentsTab(page);

    await expect(
      page.getByRole('heading', { name: /Recently Opened/ })
    ).toBeVisible();
  });

  test('should reflect a document opened on another page without reloading', async ({
    page,
    tmpPath,
    baseURL,
  }) => {
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${NOTEBOOK}`),
      `${tmpPath}/${NOTEBOOK}`
    );

    // Open the tree page first; it stays open (and is never reloaded) for the
    // rest of the test.
    await page.goto(`tree/${tmpPath}`);
    await expect(page.locator('.jp-TreePanel >> text="Recents"')).toBeVisible();

    // Open the notebook in a separate page of the same browser context, and
    // wait for it to be fully loaded so the recent entry is persisted to the
    // shared local storage, then close it.
    const notebookPage = await page.context().newPage();
    await notebookPage.goto(`${baseURL}/notebooks/${tmpPath}/${NOTEBOOK}`);
    await waitForNotebook(notebookPage);
    await notebookPage.close();

    // Viewing the Recents tab on the still-open tree page reflects the newly
    // opened document, read live from the shared local storage, without
    // reloading the page.
    await openRecentsTab(page);
    await expect(
      page.locator(
        `#jp-recents-tree .jp-RunningSessions-itemLabel >> text="${NOTEBOOK}"`
      )
    ).toBeVisible();
  });

  test('should refresh the open Recents tab when the page is revealed', async ({
    page,
    tmpPath,
    baseURL,
  }) => {
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${NOTEBOOK}`),
      `${tmpPath}/${NOTEBOOK}`
    );

    // Open the tree page on the Recents tab, with no recent documents yet, and
    // keep it as the active tab for the rest of the test.
    await page.goto(`tree/${tmpPath}`);
    await openRecentsTab(page);
    await expect(
      page.locator('#jp-recents-tree .jp-RunningSessions-item')
    ).toHaveCount(0);

    // Open (and close) the notebook on a separate page so it is recorded in the
    // shared local storage, without re-showing the tree page's Recents tab.
    const notebookPage = await page.context().newPage();
    await notebookPage.goto(`${baseURL}/notebooks/${tmpPath}/${NOTEBOOK}`);
    await waitForNotebook(notebookPage);
    await notebookPage.close();

    // Returning to a backgrounded browser tab fires a `visibilitychange` event,
    // which the recents manager uses to refresh a Recents tab that is already
    // shown. Headless browsers keep every page "visible" and never fire it on
    // their own, so dispatch the same event the browser fires when the tree tab
    // is revealed again.
    await page.evaluate(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // The already-open Recents tab now reflects the document opened elsewhere.
    await expect(
      page.locator(
        `#jp-recents-tree .jp-RunningSessions-itemLabel >> text="${NOTEBOOK}"`
      )
    ).toBeVisible();
  });

  test.describe('with a recently opened notebook', () => {
    test.beforeEach(async ({ page, tmpPath }) => {
      await page.contents.uploadFile(
        path.resolve(__dirname, `./notebooks/${NOTEBOOK}`),
        `${tmpPath}/${NOTEBOOK}`
      );

      // Open the notebook so it is recorded as recently opened, and wait for it
      // to be fully loaded so the recents are persisted before navigating away.
      await page.goto(`notebooks/${tmpPath}/${NOTEBOOK}`);
      await waitForNotebook(page);
    });

    test('should list the notebook in the Recents tab', async ({
      page,
      tmpPath,
    }) => {
      await page.goto(`tree/${tmpPath}`);
      await openRecentsTab(page);

      // The notebook is listed...
      await expect(
        page.locator(
          `#jp-recents-tree .jp-RunningSessions-itemLabel >> text="${NOTEBOOK}"`
        )
      ).toBeVisible();

      // ...and the parent directory is filtered out, so only the document is
      // shown.
      await expect(
        page.locator('#jp-recents-tree .jp-RunningSessions-item')
      ).toHaveCount(1);

      // The item shows when the document was last opened.
      await expect(
        page.locator('#jp-recents-tree .jp-RunningSessions-itemDetail')
      ).toHaveText(/now|ago/);
    });

    test('should reopen the notebook from the Recents tab', async ({
      page,
      tmpPath,
    }) => {
      await page.goto(`tree/${tmpPath}`);
      await openRecentsTab(page);

      // Clicking the recent item opens the document in a new browser tab.
      const [notebook] = await Promise.all([
        page.waitForEvent('popup'),
        page
          .locator(
            `#jp-recents-tree .jp-RunningSessions-itemLabel >> text="${NOTEBOOK}"`
          )
          .click(),
      ]);

      await notebook.waitForSelector('.jp-Notebook');
      expect(notebook.url()).toContain(`/notebooks/${tmpPath}/${NOTEBOOK}`);
      await notebook.close();
    });

    test('should list the notebook in the File > Open Recent menu', async ({
      page,
      tmpPath,
    }) => {
      // The page is still on the notebook opened in `beforeEach`, which has a
      // menu bar.
      const submenu = (await page.menu.openLocator(
        'File>Open Recent'
      )) as Locator;
      const item = submenu.locator('.lm-Menu-item', { hasText: NOTEBOOK });
      await expect(item).toBeVisible();

      // Opening the recent document from the menu opens it in a new browser
      // tab...
      const [notebook] = await Promise.all([
        page.waitForEvent('popup'),
        item.click(),
      ]);
      await notebook.waitForSelector('.jp-Notebook');
      expect(notebook.url()).toContain(`/notebooks/${tmpPath}/${NOTEBOOK}`);
      await notebook.close();

      // ...and leaves the current page intact, even when reopening the
      // document currently displayed on the page.
      await expect(page.locator('.jp-Notebook')).toBeVisible();
    });

    test('should clear the recents from the File > Open Recent menu', async ({
      page,
      tmpPath,
    }) => {
      await page.menu.clickMenuItem('File>Open Recent>Clear Recent Documents');

      await page.goto(`tree/${tmpPath}`);
      await openRecentsTab(page);
      await expect(
        page.locator('#jp-recents-tree .jp-RunningSessions-item')
      ).toHaveCount(0);
    });

    test('should forget the notebook from the Recents tab', async ({
      page,
      tmpPath,
    }) => {
      await page.goto(`tree/${tmpPath}`);
      await openRecentsTab(page);

      const item = page.locator('#jp-recents-tree .jp-RunningSessions-item', {
        hasText: NOTEBOOK,
      });
      await expect(item).toBeVisible();

      // Reveal and click the "Forget" button to remove the document.
      await item.hover();
      await item.locator('.jp-RunningSessions-itemShutdown').click();

      await expect(item).toHaveCount(0);
    });
  });
});
