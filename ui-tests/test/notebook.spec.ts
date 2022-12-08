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
      return document.querySelector('#jp-NotebookLogo')?.getAttribute('href');
    });
    expect(href).toContain('/tree');
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
    await page
      .locator(`text=File Path${NOTEBOOK}New Name >> input`)
      .fill(newName);

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
  // and usable in Jupyter Notebook without active tabs
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

    // wait for the checkpoint indicator to be displayed before exexuting the cells
    await page.waitForSelector('.jp-NotebookCheckpoint');
    await page.click('.jp-Notebook');

    // execute the first cell
    await runAndAdvance(page);
    await page
      .locator('.jp-mod-outputsScrolled')
      .nth(0)
      .waitFor({ state: 'visible' });

    // execute the second cell
    await runAndAdvance(page);
    // the second cell should not be auto scrolled
    expect(page.locator('.jp-mod-outputsScrolled').nth(1)).toHaveCount(0);

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

  test('Open table of content left panel', async ({ page, tmpPath }) => {
    const notebook = 'simple_toc.ipynb';
    const menuPath = 'View>Left Sidebar>Show Table of Contents';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    await waitForKernelReady(page);

    await page.menu.clickMenuItem(menuPath);

    const panel = page.locator('#jp-left-stack');
    expect(await panel.isVisible()).toBe(true);

    await expect(
      panel.locator(
        '.jp-SidePanel-content > .jp-TableOfContents-tree > .jp-TableOfContents-content'
      )
    ).toHaveCount(1);
    await expect(
      panel.locator(
        '.jp-SidePanel-content > .jp-TableOfContents-tree > .jp-TableOfContents-content > .jp-tocItem'
      )
    ).toHaveCount(3);

    const imageName = 'toc-left-panel.png';

    expect(await panel.screenshot()).toMatchSnapshot(imageName);
  });

  test('Open notebook tools right panel', async ({ page, tmpPath }) => {
    const notebook = 'simple.ipynb';
    const menuPath = 'View>Right Sidebar>Show Notebook Tools';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    await waitForKernelReady(page);

    await page.menu.clickMenuItem(menuPath);

    const panel = page.locator('#jp-right-stack');
    expect(await panel.isVisible()).toBe(true);

    await page.isVisible('#notebook-tools.jp-NotebookTools');

    await page.isVisible('#notebook-tools.jp-NotebookTools > #add-tag.tag');

    const imageName = 'notebooktools-right-panel.png';
    expect(await panel.screenshot()).toMatchSnapshot(imageName);
  });
});
