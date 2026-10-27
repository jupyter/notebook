import { expect, galata } from '@jupyterlab/galata';

import type { ConsolePanel } from '@jupyterlab/console';

import type { NotebookPanel } from '@jupyterlab/notebook';

import { test } from './fixtures';

import { runAndAdvance, waitForKernelReady } from './utils';

test.use({ autoGoto: false });

test.describe('Smoke', () => {
  test('Tour', async ({ page, tmpPath, kernels, sessions }) => {
    if (!kernels || !sessions) {
      throw new Error('The smoke tour requires isolated runner tracking.');
    }
    // Open the tree page
    await page.goto(`tree/${tmpPath}`);
    await page.locator('.jp-TreePanel >> text="Running"').click();
    await page.locator('.jp-TreePanel >> text="Files"').click();

    // Create a new console
    await page.menu.clickMenuItem('New>Console');
    // Choose the kernel
    const [console] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('text="Select"'),
    ]);
    await console.waitForLoadState();
    await console.waitForSelector('.jp-CodeConsole');

    // Create a new notebook
    const notebookPromise = page.waitForEvent('popup');
    await page.click('text="New"');
    await page
      .locator(
        '[data-command="notebook:create-new"] >> text="Python 3 (ipykernel)"'
      )
      .click();
    const notebook = await notebookPromise;

    try {
      // we may have to select the kernel first
      await notebook.click('text="Select"', { timeout: 5000 });
    } catch {
      // The kernel is already selected
    }
    await waitForKernelReady(notebook);

    // Enter code in the first cell
    await notebook.locator(
      '.jp-Cell-inputArea >> .cm-editor >> .cm-content[contenteditable="true"]'
    ).type(`import math

math.pi`);

    // Run the cell
    await runAndAdvance(notebook);

    // Enter code in the next cell
    await notebook
      .locator(
        '.jp-Cell-inputArea >> .cm-editor >> .cm-content[contenteditable="true"]'
      )
      .nth(1)
      .type('import this');

    // Run the cell
    await runAndAdvance(notebook);

    // Save the notebook
    // TODO: re-enable after fixing the name on save dialog?
    // await notebook.click('//span/*[local-name()="svg"]');

    // Click on the Jupyter logo to open the tree page
    const [tree2] = await Promise.all([
      notebook.waitForEvent('popup'),
      notebook.click(
        '//*[local-name()="svg" and normalize-space(.)=\'Jupyter\']'
      ),
    ]);

    // Popups do not inherit page-level routes. Keep "Shut Down All" scoped to
    // this tour's sessions, rather than shutting down other workers' kernels.
    const ownedSessions = await Promise.all([
      notebook.evaluate(() => {
        const panel = window.jupyterapp.shell.currentWidget as NotebookPanel;
        return panel.sessionContext.session?.model;
      }),
      console.evaluate(() => {
        const panel = window.jupyterapp.shell.currentWidget as ConsolePanel;
        return panel.console.sessionContext.session?.model;
      }),
    ]);
    for (const session of ownedSessions) {
      expect(session).toBeDefined();
      expect(session?.kernel).toBeTruthy();
      if (session?.kernel) {
        sessions.set(session.id, session);
        kernels.set(session.kernel.id, session.kernel);
      }
    }
    await galata.Mock.mockRunners(tree2, kernels, 'kernels');
    await galata.Mock.mockRunners(tree2, sessions, 'sessions', kernels);
    await tree2.reload({ waitUntil: 'domcontentloaded' });
    await tree2.waitForSelector('#main-panel');
    await tree2.evaluate(async () => {
      await window.jupyterapp.restored;
    });

    const ownedKernelIds = ownedSessions.map((session) => session!.kernel!.id);
    await expect
      .poll(() =>
        tree2.evaluate(() =>
          Array.from(window.jupyterapp.serviceManager.kernels.running())
            .map((kernel) => kernel.id)
            .sort()
        )
      )
      .toEqual(ownedKernelIds.sort());

    // Shut down the kernels
    await tree2.locator('.jp-TreePanel >> text="Running"').click();
    await tree2.click('#main-panel jp-button :text("Shut Down All")');
    await tree2.press('.jp-Dialog', 'Enter');

    // Confirmation closes before shutdownAll finishes refreshing its models.
    // Keep the scoped routes installed until that asynchronous work is done.
    await expect
      .poll(() =>
        tree2.evaluate(
          () =>
            Array.from(window.jupyterapp.serviceManager.kernels.running())
              .length
        )
      )
      .toBe(0);

    // Close the pages
    await tree2.unrouteAll({ behavior: 'wait' });
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
      page.menu.clickMenuItem('View>Open JupyterLab'),
    ]);
    await lab.waitForSelector('.jp-Launcher');
    await lab.close();

    expect(true).toBe(true);
  });
});
