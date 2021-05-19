import { chromium, firefox, Browser } from 'playwright';

import { BASE_URL, BrowserName } from './utils';

describe('Tree', () => {
  let browser: Browser;

  beforeEach(async () => {
    const browserName: BrowserName =
      (process.env.BROWSER as BrowserName) || 'chromium';
    browser = await { chromium, firefox }[browserName].launch({ slowMo: 100 });
  });

  afterEach(() => {
    browser.close();
  });

  describe('File Browser', () => {
    it('should render a New Notebook button', async () => {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}retro/tree`);

      const button = await page.$('text="New Notebook"');
      expect(button).toBeDefined();
    });
  });
});
