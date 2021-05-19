// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { chromium, firefox, Browser } from 'playwright';

import { BrowserName, BASE_URL } from './utils';

const NOTEBOOK_PATH = 'app/test/data/example.ipynb';
const NOTEBOOK_URL = `${BASE_URL}retro/notebooks/${NOTEBOOK_PATH}`;

describe('Notebook', () => {
  let browser: Browser;

  beforeEach(async () => {
    const browserName = (process.env.BROWSER as BrowserName) || 'chromium';
    browser = await { chromium, firefox }[browserName].launch({ slowMo: 100 });
  });

  afterEach(() => {
    browser.close();
  });

  describe('Title', () => {
    it('should be rendered', async () => {
      const page = await browser.newPage();
      await page.goto(NOTEBOOK_URL);
      await page.waitForTimeout(2000);
      const href = await page.evaluate(() => {
        return document.querySelector('#jp-RetroLogo')?.getAttribute('href');
      });
      expect(href).toContain('/retro/tree');
    });
  });

  describe('Renaming', () => {
    it('should be possible to rename the notebook', async () => {
      const page = await browser.newPage();
      await page.goto(NOTEBOOK_URL);

      // Click on the title
      await page.click('text="example.ipynb"');

      // Rename in the input dialog
      const newName = 'test.ipynb';
      await page.fill(
        `//div[normalize-space(.)='File Path${NOTEBOOK_PATH}New Name']/input`,
        newName
      );
      await Promise.all([
        page.waitForNavigation(),
        page.click('text="Rename"')
      ]);

      // Check the URL contains the new name
      const url = page.url();
      expect(url).toContain(newName);
    });
  });
});
