import { test, expect } from '@playwright/test';

test('Prevent concurrent cell execution', async ({ page }) => {
  await page.goto('http://localhost:8888/notebooks/untitled.ipynb');
  await page.locator('.jp-Cell-inputArea').nth(0).fill('i = 0');
  await page.locator('.jp-Cell-inputArea').nth(0).press('Control+Enter');
  await page.keyboard.press('b');
  await page.locator('.jp-Cell-inputArea').nth(1).fill(`
    import time
    time.sleep(5)
    print("done %d" % i)
    i = i + 1
  `);
  await page.locator('.jp-Cell-inputArea').nth(1).press('Shift+Enter');
  await page.locator('.jp-Cell-inputArea').nth(1).press('Shift+Enter');
  await page.locator('.jp-Cell-inputArea').nth(1).press('Shift+Enter');
  await page.waitForSelector('.jp-Cell-outputArea');
  const outputs = await page.$$eval('.jp-Cell-outputArea', nodes =>
    nodes.map(n => n.textContent)
  );
  expect(outputs.length).toBe(1);
  expect(outputs[0]).toContain('done 0');
  await page.keyboard.press('b');
  await page.locator('.jp-Cell-inputArea').nth(2).fill('print(i)');
  await page.locator('.jp-Cell-inputArea').nth(2).press('Control+Enter');
  const finalOutput = await page.locator('.jp-Cell-outputArea').nth(2).textContent();
  expect(finalOutput).toContain('1');
});