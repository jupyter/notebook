import { chromium, Browser } from 'playwright';

const JUPYTERLAB_CLASSIC = 'http://localhost:8889/classic/tree';

const NEW_NOTEBOOK =
  '#filebrowser > div.lm-Widget.p-Widget.jp-Toolbar.jp-scrollbar-tiny.jp-FileBrowser-toolbar > div:nth-child(1) > button';

describe('Tree', () => {
  let browser: Browser;

  beforeEach(async () => {
    browser = await chromium.launch({ headless: false, slowMo: 100 });
  });

  afterEach(() => {
    browser.close();
  });

  describe('File Browser', () => {
    it('should be rendered', async () => {
      const page = await browser.newPage();
      await page.goto(JUPYTERLAB_CLASSIC);
      await page.waitForSelector(NEW_NOTEBOOK);

      const button = await page.$(NEW_NOTEBOOK);
      await page.screenshot({ path: 'screenshot.png', fullPage: true });
      expect(button).toBeDefined();
    });
  });
});
