// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { expect } from '@jupyterlab/galata';

import { test } from './fixtures';

const NOTEBOOK = 'simple.ipynb';
const MARKDOWN = 'README.md';

test.use({ autoGoto: false });

test.describe('Open With', () => {
  test.beforeEach(async ({ page, tmpPath }) => {
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${NOTEBOOK}`),
      `${tmpPath}/${NOTEBOOK}`
    );
    await page.contents.uploadContent(
      '# Open With\n\nSome text.',
      'text',
      `${tmpPath}/${MARKDOWN}`
    );
  });

  /**
   * Open a URL in a new page.
   *
   * The galata page fails when the application changes the URL while it loads.
   */
  const openUrl = async ({ context, baseURL }, url: string) => {
    const page = await context.newPage();
    await page.goto(`${baseURL}/${url}`);
    return page;
  };

  test('Open a notebook in the text editor', async ({
    context,
    baseURL,
    tmpPath,
  }) => {
    const page = await openUrl(
      { context, baseURL },
      `tree/${tmpPath}/${NOTEBOOK}?open-with=txt`
    );

    await expect(page).toHaveURL(new RegExp(`/edit/${tmpPath}/${NOTEBOOK}`));
    await expect(page.locator('.jp-FileEditor .cm-editor')).toBeVisible();
    await expect(page.locator('.jp-Notebook')).toHaveCount(0);
  });

  test('Open a notebook in the JSON viewer', async ({
    context,
    baseURL,
    tmpPath,
  }) => {
    const page = await openUrl(
      { context, baseURL },
      `tree/${tmpPath}/${NOTEBOOK}?open-with=json`
    );

    await expect(page).toHaveURL(new RegExp(`/edit/${tmpPath}/${NOTEBOOK}`));
    await expect(page.locator('.jp-RenderedJSON')).toBeVisible();
  });

  test('Open a Markdown file in the Markdown Preview', async ({
    context,
    baseURL,
    tmpPath,
  }) => {
    const page = await openUrl(
      { context, baseURL },
      `tree/${tmpPath}/${MARKDOWN}?open-with=Markdown+Preview`
    );

    await expect(page).toHaveURL(new RegExp(`/edit/${tmpPath}/${MARKDOWN}`));
    await expect(
      page.locator('#main-panel .jp-RenderedMarkdown h1', {
        hasText: 'Open With',
      })
    ).toBeVisible();
  });

  test('Open a notebook with a notebook viewer', async ({
    context,
    baseURL,
    tmpPath,
  }) => {
    const page = await openUrl(
      { context, baseURL },
      `tree/${tmpPath}/${NOTEBOOK}?open-with=ipynb`
    );

    await expect(page).toHaveURL(
      new RegExp(`/notebooks/${tmpPath}/${NOTEBOOK}$`)
    );
    await expect(page.locator('.jp-Notebook')).toBeVisible();
  });

  test('Open the JSON viewer from the notebook page', async ({
    context,
    baseURL,
    tmpPath,
  }) => {
    const page = await openUrl(
      { context, baseURL },
      `notebooks/${tmpPath}/${NOTEBOOK}?open-with=json`
    );

    await expect(page).toHaveURL(
      new RegExp(`/edit/${tmpPath}/${NOTEBOOK}\\?open-with=JSON$`)
    );
    await expect(page.locator('.jp-RenderedJSON')).toBeVisible();
  });

  test('Use the default viewer for an unknown value', async ({
    context,
    baseURL,
    tmpPath,
  }) => {
    const page = await openUrl(
      { context, baseURL },
      `tree/${tmpPath}/${NOTEBOOK}?open-with=unknown`
    );

    await expect(page).toHaveURL(
      new RegExp(`/notebooks/${tmpPath}/${NOTEBOOK}$`)
    );
    await expect(page.locator('.jp-Notebook')).toBeVisible();
  });

  test('Open With in the file browser uses open-with', async ({
    page,
    tmpPath,
  }) => {
    await page.goto(`tree/${tmpPath}`);

    await page.getByText(NOTEBOOK).last().click({ button: 'right' });
    await page.getByText('Open With', { exact: true }).hover();
    const [editor] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('menuitem', { name: 'Editor', exact: true }).click(),
    ]);

    await expect(editor).toHaveURL(
      new RegExp(`/edit/${tmpPath}/${NOTEBOOK}\\?open-with=Editor$`)
    );
    await expect(editor.locator('.jp-FileEditor .cm-editor')).toBeVisible();
  });

  test('Move an existing factory link to the page of its viewer', async ({
    context,
    baseURL,
    tmpPath,
  }) => {
    const page = await openUrl(
      { context, baseURL },
      `notebooks/${tmpPath}/${NOTEBOOK}?factory=Editor`
    );

    await expect(page).toHaveURL(
      new RegExp(`/edit/${tmpPath}/${NOTEBOOK}\\?open-with=Editor$`)
    );
    await expect(page.locator('.jp-FileEditor .cm-editor')).toBeVisible();
  });

  test('Use the default viewer for an unknown factory', async ({
    context,
    baseURL,
    tmpPath,
  }) => {
    const page = await openUrl(
      { context, baseURL },
      `edit/${tmpPath}/${NOTEBOOK}?factory=unknown`
    );

    await expect(page).toHaveURL(
      new RegExp(`/notebooks/${tmpPath}/${NOTEBOOK}$`)
    );
    await expect(page.locator('.jp-Notebook')).toBeVisible();
  });
});
