// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { expect } from '@playwright/test';

import { test } from './fixtures';

import { hideAddCellButton, waitForKernelReady } from './utils';

test.describe('General', () => {
  test('The notebook should render', async ({ page, tmpPath, browserName }) => {
    const notebook = 'simple.ipynb';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    // wait for the kernel status animations to be finished
    await waitForKernelReady(page);
    await page.waitForSelector(
      ".jp-Notebook-ExecutionIndicator[data-status='idle']"
    );

    const checkpointLocator = '.jp-NotebookCheckpoint';
    // wait for the checkpoint indicator to be displayed
    await page.waitForSelector(checkpointLocator);

    // remove the amount of seconds manually since it might display strings such as "3 seconds ago"
    await page
      .locator(checkpointLocator)
      .evaluate(
        (element) => (element.innerHTML = 'Last Checkpoint: 3 seconds ago')
      );

    // check the notebook footer shows up on hover
    const notebookFooter = '.jp-Notebook-footer';
    await page.hover(notebookFooter);
    await page.waitForSelector(notebookFooter);

    // hover somewhere else to make the add cell disappear
    await page.hover('#jp-top-bar');

    // special case for firefox headless issue
    // see https://github.com/jupyter/notebook/pull/6872#issuecomment-1549594166 for more details
    if (browserName === 'firefox') {
      await hideAddCellButton(page);
    }

    expect(await page.screenshot()).toMatchSnapshot('notebook.png');
  });
});
