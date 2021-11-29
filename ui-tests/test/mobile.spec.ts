// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { expect } from '@playwright/test';

import { test } from './fixtures';

test.use({ autoGoto: false, viewport: { width: 512, height: 768 } });

test.describe('Mobile', () => {
  test('The layout should be more compact on the file browser page', async ({
    page,
    tmpPath
  }) => {
    await page.goto(`tree/${tmpPath}`);
    await page.waitForSelector('#top-panel-wrapper', { state: 'hidden' });
    expect(await page.screenshot()).toMatchSnapshot('tree.png');
  });

  test('The layout should be more compact on the notebook page', async ({
    page,
    tmpPath
  }) => {
    const notebook = 'empty.ipynb';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);
    // TODO: investigate why this does not run the cells in RetroLab
    // await page.notebook.run();

    // wait for the kernel status animations to be finished
    await page.waitForSelector('.jp-RetroKernelStatus-fade');
    await page.waitForFunction(() => {
      const status = window.document.getElementsByClassName(
        'jp-RetroKernelStatus'
      )[0];

      if (!status) {
        return false;
      }

      const finished = status?.getAnimations().reduce((prev, curr) => {
        return prev && curr.playState === 'finished';
      }, true);
      return finished;
    });

    expect(await page.screenshot()).toMatchSnapshot('notebook.png');
  });
});
