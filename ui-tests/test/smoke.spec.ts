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
    await page.menu.clickMenuItem('New>Console');
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
      page.click('text="New"'),
      page.click('text="Notebook"')
    ]);

    try {
      // we may have to select the kernel first
      await notebook.click('text="Select"', { timeout: 5000 });
    } catch (e) {
      // The kernel is already selected
    }

    // Enter code in the first cell
    await notebook.locator(
      '.jp-Cell-inputArea >> .cm-editor >> .cm-content[contenteditable="true"]'
    ).type(`import math

math.pi`);

    // Run the cell
    runAndAdvance(notebook);

    // Enter code in the next cell
    await notebook
      .locator(
        '.jp-Cell-inputArea >> .cm-editor >> .cm-content[contenteditable="true"]'
      )
      .nth(1)
      .type('import this');

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
    await tree2.click('#main-panel button :text("Shut Down All")');
    await tree2.press('.jp-Dialog', 'Enter');

    // Close the pages
    await tree2.close();
    await notebook.close();
    await console.close();
    await page.close();

    expect(true).toBe(true);
  });

  test('JupyterLab', async ({ page, tmpPath }) => {
    // Open the tree page
    await page.goto(`tree/${tmpPath}`);

    // Open JupyterLab
    const [lab] = await Promise.all([
      page.waitForEvent('popup'),
      page.menu.clickMenuItem('View>Open JupyterLab')
    ]);
    await lab.waitForSelector('.jp-Launcher');
    await lab.close();

    expect(true).toBe(true);
  });
});
