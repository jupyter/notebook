import { expect } from '@playwright/test';

import { test } from './fixtures';

import { runAndAdvance } from './utils';

test.use({ autoGoto: false });

test.describe('Smoke', () => {
  test('Tour', async ({ page, tmpPath }) => {
    // Open the tree page
    await page.goto(`tree/${tmpPath}`);
    await page.click('text="Running"');
    await page.click('text="Files"');

    // Create a new console
    await page.click('text="New Console"');
    // Choose the kernel
    const [console] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('text="Select"')
    ]);
    await console.waitForLoadState();
    await console.waitForSelector('.jp-CodeConsole');

    // Create a new notebook
    const [notebook] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('text="New Notebook"')
    ]);

    // Enter code in the first cell
    await notebook.fill('//textarea', 'import math');
    await notebook.press('//textarea', 'Enter');
    await notebook.press('//textarea', 'Enter');
    await notebook.fill('//textarea', 'math.pi');

    // Run the cell
    runAndAdvance(notebook);

    // Enter code in the next cell
    await notebook.fill(
      "//div[normalize-space(.)=' ​']/div[1]/textarea",
      'import this'
    );

    // Run the cell
    runAndAdvance(notebook);

    // Save the notebook
    // TODO: re-enable after fixing the name on save dialog?
    // await notebook.click('//span/*[local-name()="svg"]');

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
    await console.close();
    await page.close();

    expect(true).toBe(true);
  });
});
