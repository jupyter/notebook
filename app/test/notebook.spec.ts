// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { chromium, Browser } from 'playwright';

const JUPYTERLAB_CLASSIC =
  'http://localhost:8889/classic/notebooks/binder/example.ipynb';

const TITLE_XPATH = '//*[@id="jp-title"]/h1';

const RENAME_SELECTOR =
  'div.lm-Widget.p-Widget.jp-FileDialog.jp-Dialog-body > input';

const ACCEPT_SELECTOR =
  'body > div.lm-Widget.p-Widget.jp-Dialog > div > div.lm-Widget.p-Widget.jp-Dialog-footer > button.jp-Dialog-button.jp-mod-accept.jp-mod-styled';

describe('Notebook', () => {
  let browser: Browser;

  beforeEach(async () => {
    // browser = await chromium.launch({ headless: false, slowMo: 100 });
    browser = await chromium.launch();
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
      await page.waitForSelector(TITLE_XPATH);

      await page.click(TITLE_XPATH);

      const name = await page.$(RENAME_SELECTOR);
      const newName = 'test';
      await name?.type(newName);

      await page.click(ACCEPT_SELECTOR);

      const url = page.url();
      expect(url).toContain(newName);
    });
  });
});
