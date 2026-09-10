// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { expect, IJupyterLabPageFixture } from '@jupyterlab/galata';

import { Page } from '@playwright/test';

import { test } from './fixtures';

/**
 * Create a new terminal from the New dropdown of the file browser toolbar.
 *
 * The terminal session is created via the page so it is tracked by Galata
 * and automatically disposed at the end of the test.
 */
const openTerminalFromNewDropdown = async (
  page: IJupyterLabPageFixture
): Promise<{ terminal: Page; name: string }> => {
  const terminalPromise = page.waitForEvent('popup');
  await page.click('.jp-DropdownMenu >> text="New"');
  await page.click('.lm-Menu [data-command="terminal:create-new"]');
  const terminal = await terminalPromise;
  await terminal.waitForLoadState();

  // the terminal should open in a new tab on the /terminals/<name> page
  await terminal.waitForURL(/\/terminals\/\w+/);
  const name = new URL(terminal.url()).pathname.split('/').pop() ?? '';
  return { terminal, name };
};

test.describe('Terminal', () => {
  test('Create a terminal from the New dropdown', async ({ page }) => {
    const { terminal } = await openTerminalFromNewDropdown(page);

    await expect(terminal.locator('.jp-Terminal')).toBeVisible();
    await expect(terminal.locator('.jp-Terminal .xterm-screen')).toBeVisible();

    await terminal.close();
  });

  test('Micro toolbars should not be visible on the terminal page', async ({
    page,
  }) => {
    const { terminal } = await openTerminalFromNewDropdown(page);

    await expect(terminal.locator('.jp-Terminal')).toBeVisible();

    // the micro toolbar is added to the DOM but should be hidden via CSS
    const microToolbar = terminal.locator(
      '.jp-MainAreaWidget > .jp-Toolbar-micro'
    );
    await expect(microToolbar).toHaveCount(1);
    await expect(microToolbar).toBeHidden();

    // there should not be any cell toolbar on the terminal page
    await expect(terminal.locator('.jp-cell-toolbar')).toHaveCount(0);

    await terminal.close();
  });

  test('Show and shut down a running terminal from the Running tab', async ({
    page,
  }) => {
    const { terminal, name } = await openTerminalFromNewDropdown(page);

    await expect(terminal.locator('.jp-Terminal')).toBeVisible();
    await terminal.close();

    // open the Running tab on the tree page
    await page.locator('.jp-TreePanel >> text="Running"').click();
    await expect(
      page.locator('#main-panel #jp-running-sessions-tree')
    ).toBeVisible();

    const item = page.locator(
      '#jp-running-sessions-tree .jp-RunningSessions-item',
      {
        hasText: `terminals/${name}`,
      }
    );
    await expect(item).toBeVisible();

    // shut the terminal down from the running sessions list
    await item.hover();
    await item.locator('.jp-RunningSessions-itemShutdown').click();

    await expect(item).toHaveCount(0);
  });

  test('Execute a command in the terminal', async ({ page, request }) => {
    const { terminal, name } = await openTerminalFromNewDropdown(page);

    await expect(terminal.locator('.jp-Terminal .xterm-screen')).toBeVisible();
    await terminal.locator('.jp-Terminal').click();

    // the terminal output is not exposed in the DOM (xterm renders to a
    // canvas), so exit the shell and check the terminal session gets
    // terminated as a result. The shell may not be ready to process input
    // right away, so retry typing the command until the session is gone.
    await expect
      .poll(
        async () => {
          await terminal.keyboard.type('exit');
          await terminal.keyboard.press('Enter');
          const response = await request.get('/api/terminals');
          const models = (await response.json()) as { name: string }[];
          return models.map((model) => model.name);
        },
        { timeout: 30000 }
      )
      .not.toContain(name);

    await terminal.close();
  });

  test('Open a terminal directly from its URL', async ({ page, request }) => {
    const { terminal, name } = await openTerminalFromNewDropdown(page);

    await expect(terminal.locator('.jp-Terminal')).toBeVisible();
    await terminal.close();

    await page.goto(`terminals/${name}`);

    await expect(page.locator('.jp-Terminal')).toBeVisible();
    await expect(page.locator('.jp-Terminal .xterm-screen')).toBeVisible();

    // the page should have connected to the existing terminal session
    // instead of creating a new one
    const response = await request.get('/api/terminals');
    const models = (await response.json()) as { name: string }[];
    expect(models.map((model) => model.name)).toEqual([name]);
  });
});
