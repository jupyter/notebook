import { chromium, firefox, Browser, BrowserContext } from 'playwright';

import { BrowserName, BASE_URL } from './utils';

describe('Smoke', () => {
  let browser: Browser;
  let context: BrowserContext;

  beforeAll(async () => {
    jest.setTimeout(200000);
    const browserName = (process.env.BROWSER as BrowserName) || 'chromium';
    browser = await { chromium, firefox }[browserName].launch({ slowMo: 100 });
    context = await browser.newContext({
      recordVideo: { dir: 'artifacts/videos/' }
    });
  });

  afterAll(async () => {
    await context.close();
    await browser.close();
  });

  describe('Tour', () => {
    it('should open a new new notebook and stop the kernel after', async () => {
      const tree = await context.newPage();

      // Open the tree page
      await tree.goto(`${BASE_URL}retro/tree`);
      await tree.click('text="Running"');
      await tree.click('text="Files"');

      // Create a new notebook
      const [notebook] = await Promise.all([
        tree.waitForEvent('popup'),
        tree.click('text="New Notebook"')
      ]);

      // Choose the kernel
      await notebook.click('text="Select"');
      await notebook.click('pre[role="presentation"]');

      // Enter code in the first cell
      await notebook.fill('//textarea', 'import math');
      await notebook.press('//textarea', 'Enter');
      await notebook.press('//textarea', 'Enter');
      await notebook.fill('//textarea', 'math.pi');

      // Run the cell
      await notebook.click(
        "//button[normalize-space(@title)='Run the selected cells and advance']"
      );

      // Enter code in the next cell
      await notebook.fill(
        "//div[normalize-space(.)=' ​']/div[1]/textarea",
        'import this'
      );

      // Run the cell
      await notebook.click(
        '//button[normalize-space(@title)=\'Run the selected cells and advance\']/span/span/*[local-name()="svg"]'
      );

      // Save the notebook
      await notebook.click('//span/*[local-name()="svg"]');

      // Click on the Jupyter logo to open the tree page
      const [tree2] = await Promise.all([
        notebook.waitForEvent('popup'),
        notebook.click(
          '//*[local-name()="svg" and normalize-space(.)=\'Jupyter\']'
        )
      ]);

      // Shut down the kernels
      await tree2.click('text="Running"');
      await tree2.click('text="Shut Down All"');
      await tree2.click("//div[normalize-space(.)='Shut Down All']");

      // Close the pages
      await tree2.close();
      await notebook.close();
      await tree.close();

      expect(true).toBe(true);
    });
  });
});
