// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { expect } from '@playwright/test';

import { test } from './fixtures';

import { runAndAdvance, waitForKernelReady } from './utils';

const NOTEBOOK = 'example.ipynb';

test.use({ autoGoto: false });

test.describe('Notebook', () => {
  test.beforeEach(async ({ page, tmpPath }) => {
    await page.contents.uploadFile(
      path.resolve(__dirname, `../../binder/${NOTEBOOK}`),
      `${tmpPath}/${NOTEBOOK}`
    );
  });

  test('Title should be rendered', async ({ page, tmpPath }) => {
    await page.goto(`notebooks/${tmpPath}/${NOTEBOOK}`);
    const href = await page.evaluate(() => {
      return document.querySelector('#jp-RetroLogo')?.getAttribute('href');
    });
    expect(href).toContain('/retro/tree');
  });

  test('Renaming the notebook should be possible', async ({
    page,
    tmpPath
  }) => {
    const notebook = `${tmpPath}/${NOTEBOOK}`;
    await page.goto(`notebooks/${notebook}`);

    // Click on the title (with .ipynb extension stripped)
    await page.click('text="example"');

    // Rename in the input dialog
    const newName = 'test.ipynb';
    const newNameStripped = 'test';
    await page.fill(
      `//div[normalize-space(.)='File Path${notebook}New Name']/input`,
      newName
    );

    await Promise.all([
      await page.click('text="Rename"'),
      // wait until the URL is updated
      await page.waitForNavigation()
    ]);

    // Check the URL contains the new name
    const url = page.url();
    expect(url).toContain(newNameStripped);
  });

  // TODO: rewrite with page.notebook when fixed upstream in Galata
  // and usable in RetroLab without active tabs
  test('Outputs should be scrolled automatically', async ({
    page,
    tmpPath
  }) => {
    const notebook = 'autoscroll.ipynb';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    await waitForKernelReady(page);
    // run the two cells
    await runAndAdvance(page);
    await runAndAdvance(page);

    await page.waitForSelector('.jp-Cell-outputArea pre');

    const checkCell = async (n: number): Promise<boolean> => {
      const scrolled = await page.$eval(`.jp-Notebook-cell >> nth=${n}`, el =>
        el.classList.contains('jp-mod-outputsScrolled')
      );
      return scrolled;
    };

    // check the long output area is auto scrolled
    expect(await checkCell(0)).toBe(true);

    // check the short output area is not auto scrolled
    expect(await checkCell(1)).toBe(false);
  });
});
