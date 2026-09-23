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
  await page.click('.lm-Menu [data-command="filebrowser:create-new-terminal"]');
  const terminal = await terminalPromise;
  await terminal.waitForLoadState();

  // the terminal should open in a new tab on the /terminals/<name> page
  await terminal.waitForURL(/\/terminals\/\w+/);
  const name = new URL(terminal.url()).pathname.split('/').pop() ?? '';
  return { terminal, name };
};

/**
 * Open the Running tab on the tree page.
 */
const openRunningTab = async (page: IJupyterLabPageFixture): Promise<void> => {
  await page.locator('.jp-TreePanel >> text="Running"').click();
  await expect(
    page.locator('#main-panel #jp-running-sessions-tree')
  ).toBeVisible();
};

/**
 * Locate a terminal entry in the running sessions list.
 */
const runningTerminal = (page: IJupyterLabPageFixture, name: string) =>
  page.locator('#jp-running-sessions-tree .jp-RunningSessions-item', {
    hasText: `terminals/${name}`,
  });

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

    await expect(terminal.locator('.jp-cell-toolbar')).toHaveCount(0);

    await terminal.close();
  });

  test('Show and shut down a running terminal from the Running tab', async ({
    page,
  }) => {
    const { terminal, name } = await openTerminalFromNewDropdown(page);

    await expect(terminal.locator('.jp-Terminal')).toBeVisible();
    await terminal.close();

    await openRunningTab(page);

    const item = runningTerminal(page, name);
    await expect(item).toBeVisible();

    await item.hover();
    await item.locator('.jp-RunningSessions-itemShutdown').click();

    await expect(item).toHaveCount(0);
  });

  test('Execute a command in the terminal', async ({ page }) => {
    const { terminal, name } = await openTerminalFromNewDropdown(page);

    await expect(terminal.locator('.jp-Terminal .xterm-screen')).toBeVisible();

    const item = runningTerminal(page, name);
    await openRunningTab(page);
    await expect(item).toBeVisible();

    // the terminal output is not exposed in the DOM (xterm renders to a
    // canvas), so exit the shell and check the running session goes away as a
    // result. The shell may not be ready to process input right away, so retry
    // typing the command until the entry is gone.
    await expect
      .poll(
        async () => {
          await terminal.locator('.jp-Terminal').click();
          await terminal.keyboard.type('exit');
          await terminal.keyboard.press('Enter');
          return item.count();
        },
        { timeout: 30000 }
      )
      .toBe(0);

    await terminal.close();
  });

  test('Open a terminal directly from its URL', async ({ page, tmpPath }) => {
    const { terminal, name } = await openTerminalFromNewDropdown(page);

    await expect(terminal.locator('.jp-Terminal')).toBeVisible();
    await terminal.close();

    await page.goto(`terminals/${name}`);

    await expect(page.locator('.jp-Terminal')).toBeVisible();
    await expect(page.locator('.jp-Terminal .xterm-screen')).toBeVisible();

    // the page should have connected to the existing terminal session
    // instead of creating a new one
    await page.goto(`tree/${tmpPath}`);
    await openRunningTab(page);
    const terminals = page.locator(
      '#jp-running-sessions-tree .jp-RunningSessions-item',
      { hasText: 'terminals/' }
    );
    await expect(terminals).toHaveCount(1);
    await expect(terminals).toHaveText(new RegExp(`terminals/${name}`));
  });
});
