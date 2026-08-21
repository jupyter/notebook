// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { expect } from '@jupyterlab/galata';

import { test } from './fixtures';

test.describe('Help menu', () => {
  test('Should open the About dialog', async ({ page }) => {
    await page.menu.clickMenuItem('Help>About Jupyter Notebook');

    const dialog = page.locator('.jp-Dialog.jp-AboutNotebook');
    await expect(dialog).toBeVisible();

    // The version reported in the dialog should be a valid version number
    await expect(dialog.locator('.jp-AboutNotebook-version')).toHaveText(
      /^Version: \d+\.\d+\.\d+/
    );

    // The external links should open in a new tab
    const githubLink = dialog.getByRole('link', {
      name: 'JUPYTER NOTEBOOK ON GITHUB',
    });
    await expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/jupyter/notebook'
    );
    await expect(githubLink).toHaveAttribute('target', '_blank');

    const contributorsLink = dialog.getByRole('link', {
      name: 'CONTRIBUTOR LIST',
    });
    await expect(contributorsLink).toHaveAttribute(
      'href',
      'https://github.com/jupyter/notebook/pulse'
    );
    await expect(contributorsLink).toHaveAttribute('target', '_blank');

    await expect(
      dialog.locator('.jp-AboutNotebook-about-copyright')
    ).toBeVisible();

    // Dismiss the dialog
    await dialog.getByRole('button', { name: 'Dismiss' }).click();
    await expect(dialog).toHaveCount(0);
  });

  test('Should open the Documentation in a new browser tab', async ({
    page,
  }) => {
    const documentationUrl = 'https://jupyter-notebook.readthedocs.io/';

    // Stub the external website so the test does not depend on network access
    await page.context().route(`${documentationUrl}**`, (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<html><body>Documentation</body></html>',
      })
    );

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.menu.clickMenuItem('Help>Documentation'),
    ]);

    // Only check the URL of the new tab, without waiting for the page to load
    await popup.waitForURL(`${documentationUrl}en/stable/`, {
      waitUntil: 'commit',
    });
    expect(popup.url()).toEqual(`${documentationUrl}en/stable/`);
    await popup.close();
  });
});
