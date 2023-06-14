// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { expect } from '@playwright/test';

import { galata } from '@jupyterlab/galata';

import { test } from './fixtures';

test.use({
  mockSettings: {
    ...galata.DEFAULT_SETTINGS,
    '@jupyter-notebook/application-extension:shell': {
      layout: {
        Debugger: { area: 'left' },
      },
    },
  },
});

test.describe('Layout Customization', () => {
  test('The Debugger panel should respect the settings and open in the left area', async ({
    page,
    tmpPath,
  }) => {
    const notebook = 'simple.ipynb';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    const menuPath = 'View>Left Sidebar>Show Debugger';

    await page.menu.clickMenuItem(menuPath);

    const panel = page.locator('#jp-left-stack');
    expect(await panel.isVisible()).toBe(true);

    expect(await panel.screenshot()).toMatchSnapshot('debugger.png');
  });
});
