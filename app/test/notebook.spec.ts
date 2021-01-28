// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { chromium, Browser } from 'playwright';

const JUPYTERLAB_CLASSIC =
  'http://localhost:8889/classic/notebooks/binder/example.ipynb';

describe('Notebook', () => {
  let browser: Browser;

  beforeEach(async () => {
    browser = await chromium.launch({ slowMo: 100 });
    // browser = await chromium.launch();
  });

  afterEach(() => {
    browser.close();
  });

  describe('Title', () => {
    it('should be rendered', async () => {
      const page = await browser.newPage();
      await page.goto(JUPYTERLAB_CLASSIC);
      await page.waitForTimeout(2000);
      const href = await page.evaluate(() => {
        return document.querySelector('#jp-ClassicLogo')?.getAttribute('href');
      });
      expect(href).toContain('/classic/tree');
    });
  });

  describe('Renaming', () => {
    it('should be possible to rename the notebook', async () => {
      const page = await browser.newPage();
      await page.goto(JUPYTERLAB_CLASSIC);

      // Click text="Untitled.ipynb"
      await page.click('text="example.ipynb"');

      const newName = 'test.ipynb';
      await page.fill(
        "//div[normalize-space(.)='File Pathbinder/example.ipynbNew Name']/input",
        newName
      );

      // Click text="Rename"
      await Promise.all([
        page.waitForNavigation(/*{ url: 'http://localhost:8889/classic/notebooks/test.ipynb' }*/),
        page.click('text="Rename"')
      ]);

      const url = page.url();
      expect(url).toContain(newName);
    });
  });
});
