import { test as base } from '@jupyterlab/galata';

import type { IDocumentWidget } from '@jupyterlab/docregistry';

import type { Page } from '@playwright/test';

export const test = base.extend({
  waitForApplication: async ({ baseURL }, use) => {
    const waitIsReady = async (page: Page): Promise<void> => {
      await page.waitForSelector('#main-panel');
      await page.evaluate(async () => {
        const app = window.jupyterapp;
        await app.restored;
        const widget = app.shell.currentWidget as IDocumentWidget | null;
        await widget?.context?.ready;
      });
    };
    await use(waitIsReady);
  },
});
