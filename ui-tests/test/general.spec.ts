// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { expect } from '@jupyterlab/galata';

import { test } from './fixtures';

import { waitForNotebook } from './utils';

test.use({ autoGoto: false });

test.describe('General', () => {
  test('Notebook startup registers shortcut settings without errors', async ({
    page,
    tmpPath,
    browserName,
  }) => {
    const notebook = 'simple.ipynb';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(`notebooks/${tmpPath}/${notebook}`);
    await waitForNotebook(page, browserName);

    expect(errors).toEqual([]);
  });

  test('The notebook should render', async ({ page, tmpPath, browserName }) => {
    const notebook = 'simple.ipynb';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    // check the notebook footer shows up on hover
    const notebookFooter = '.jp-Notebook-footer';
    await page.hover(notebookFooter);
    await page.waitForSelector(notebookFooter);

    // hover somewhere else to make the add cell disappear
    await page.hover('#jp-top-bar');

    // click to make the blue border around the cell disappear
    await page.click('.jp-WindowedPanel-outer');

    // wait for the notebook to be ready
    await waitForNotebook(page, browserName);

    expect(await page.screenshot()).toMatchSnapshot('notebook.png');
  });
});
