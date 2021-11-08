import { test as base } from '@jupyterlab/galata';

export const test = base.extend({
  waitForApplication: async ({ baseURL }, use, testInfo) => {
    const waitIsReady = async (page): Promise<void> => {
      await page.waitForSelector('#main-panel');
    };
    await use(waitIsReady);
  }
});
