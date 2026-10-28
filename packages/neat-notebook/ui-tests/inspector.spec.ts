import { expect, test as base } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';
import type { JupyterFrontEnd, LabShell } from '@jupyterlab/application';
import type { ICodeCellModel } from '@jupyterlab/cells';
import type { NotebookPanel } from '@jupyterlab/notebook';
import { randomUUID } from 'crypto';

const PLUGIN = 'neat-notebook:cell-inspector';

interface INotebookFixture {
  path: string;
  errors: string[];
  route: (path: string) => string;
}

interface IHostBaseline {
  fingerprints: Set<string>;
  errors: string[];
}

const fingerprint = (stack: string): string =>
  stack.split('\n').slice(0, 2).join('\n');

async function ready(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    Boolean((window as Window & { jupyterapp?: JupyterFrontEnd }).jupyterapp)
  );
  // Lab restores its shell before the asynchronous tree route opens the file.
  await page.waitForFunction(() => {
    const app = (window as unknown as { jupyterapp: JupyterFrontEnd })
      .jupyterapp;
    const panel = app.shell.currentWidget as NotebookPanel | null;
    return Boolean(panel?.context && panel.content?.widgets.length);
  });
  await page.evaluate(async () => {
    const app = (window as unknown as { jupyterapp: JupyterFrontEnd })
      .jupyterapp;
    await app.restored;
    const panel = app.shell.currentWidget as NotebookPanel;
    await panel.revealed;
    await panel.context.ready;
    await panel.sessionContext.ready;
    await panel.sessionContext.session?.kernel?.info;
    await Promise.all(panel.content.widgets.map((cell) => cell.ready));
  });
}

async function createNotebook(
  request: APIRequestContext,
  file: string
): Promise<void> {
  const response = await request.put(`/api/contents/${file}`, {
    data: {
      type: 'notebook',
      format: 'json',
      content: {
        nbformat: 4,
        nbformat_minor: 5,
        metadata: {
          kernelspec: {
            name: 'python3',
            display_name: 'Python 3',
            language: 'python',
          },
        },
        cells: [
          {
            id: 'heading',
            cell_type: 'markdown',
            source: '# Data preparation',
            metadata: {},
          },
          {
            id: 'code',
            cell_type: 'code',
            source: '',
            metadata: { jupyter: { cellInspector: { note: 'preserve' } } },
            execution_count: null,
            outputs: [],
          },
          { id: 'raw', cell_type: 'raw', source: 'plain text', metadata: {} },
        ],
      },
    },
  });
  expect(response.ok()).toBeTruthy();
}

const test = base.extend<
  { notebook: INotebookFixture },
  { hostBaseline: IHostBaseline }
>({
  hostBaseline: [
    async ({ browser }, use, workerInfo) => {
      const context = await browser.newContext({
        baseURL: workerInfo.project.use.baseURL,
      });
      const page = await context.newPage();
      const file = `neat-baseline-${randomUUID()}.ipynb`;
      const errors: string[] = [];
      page.on('pageerror', (error) =>
        errors.push(error.stack ?? error.message)
      );
      await createNotebook(context.request, file);
      try {
        const url = workerInfo.project.name.startsWith('lab-')
          ? `/lab/workspaces/neat-baseline-${randomUUID()}/tree/${file}`
          : `/notebooks/${file}`;
        await page.goto(`${url}?neatHostBaseline=true`, {
          waitUntil: 'domcontentloaded',
        });
        await ready(page);
        expect(
          await page.evaluate((id) => {
            const app = (window as unknown as { jupyterapp: JupyterFrontEnd })
              .jupyterapp;
            return app.hasPlugin(id);
          }, PLUGIN)
        ).toBe(false);
        await expect(page.locator('.jp-CellInspector')).toHaveCount(0);
        // Only this baseline-proven host defect may be classified separately.
        // Other errors, including errors from Neat's remote entry, must fail.
        for (const error of errors) {
          expect(workerInfo.project.name).toMatch(/^notebook-/);
          expect(error.split('\n')[0]).toMatch(
            /TypeError: .*undefined.*schema|TypeError: .*schema.*undefined/
          );
          expect(error.split('\n')[1]).toMatch(
            /\/static\/notebook\/notebook_core\.[^/]+\.js.*:501:/
          );
        }
        const sessions = await (
          await context.request.get('/api/sessions')
        ).json();
        for (const session of sessions) {
          if (session.path === file) {
            await context.request.delete(`/api/sessions/${session.id}`);
          }
        }
        await context.request.delete(`/api/contents/${file}`);
        await use({ errors, fingerprints: new Set(errors.map(fingerprint)) });
      } finally {
        await context.close();
      }
    },
    { scope: 'worker' },
  ],
  notebook: async ({ page, request, hostBaseline }, use, testInfo) => {
    const file = `neat-${randomUUID()}.ipynb`;
    const workspace = `neat-${randomUUID()}`;
    const route = (name: string): string =>
      testInfo.project.name.startsWith('lab-')
        ? `/lab/workspaces/${workspace}/tree/${name}`
        : `/notebooks/${name}`;
    const errors: string[] = [];
    const knownHostErrors: string[] = [];
    page.on('pageerror', (error) => {
      const stack = error.stack ?? error.message;
      if (hostBaseline.fingerprints.has(fingerprint(stack))) {
        knownHostErrors.push(stack);
      } else {
        errors.push(stack);
      }
    });
    await createNotebook(request, file);
    try {
      await page.goto(route(file), { waitUntil: 'domcontentloaded' });
      await ready(page);
      if (testInfo.project.name.startsWith('lab-')) {
        await page.evaluate(() => {
          const app = (window as unknown as { jupyterapp: JupyterFrontEnd })
            .jupyterapp;
          (app.shell as LabShell).collapseLeft();
        });
      }
      expect(
        await page.evaluate((id) => {
          const app = (window as unknown as { jupyterapp: JupyterFrontEnd })
            .jupyterapp;
          return app.isPluginActivated(id);
        }, PLUGIN)
      ).toBe(true);
      await expect(page.locator('.jp-CellInspector')).toHaveCount(1);
      await use({ path: file, errors, route });
      expect(errors).toEqual([]);
    } finally {
      if (knownHostErrors.length) {
        testInfo.annotations.push({
          type: 'upstream-host',
          description:
            'Notebook shortcut schema startup defect reproduced with Neat disabled; see attached baseline.',
        });
        await testInfo.attach('host-startup-baseline', {
          body: JSON.stringify(
            { baseline: hostBaseline.errors, observed: knownHostErrors },
            null,
            2
          ),
          contentType: 'application/json',
        });
      }
      const response = await request.get('/api/sessions');
      const sessions = await response.json();
      for (const session of sessions) {
        if (session.path === file) {
          await request.delete(`/api/sessions/${session.id}`);
        }
      }
      await request.delete(`/api/contents/${file}`);
    }
  },
});

test.use({ timezoneId: 'America/Los_Angeles' });

const inspector = (page: Page) => page.locator('.jp-CellInspector');
const task = (page: Page) => inspector(page).locator('.jp-CellInspector-task');
const cells = (page: Page) =>
  page.locator('.jp-NotebookPanel:visible .jp-Notebook-cell');
const editor = (page: Page, index = 1) =>
  cells(page).nth(index).locator('.cm-content[contenteditable="true"]');

const rowCount = (page: Page) =>
  inspector(page)
    .locator(':scope > .jp-CellInspector-item')
    .evaluateAll(
      (items) =>
        new Set(
          items
            .filter((item) => item.getClientRects().length)
            .map((item) => {
              const box = item.getBoundingClientRect();
              return Math.round(box.top + box.height / 2);
            })
        ).size
    );

async function expectExecutionColor(page: Page, color: string): Promise<void> {
  const execution = inspector(page).locator('.jp-CellInspector-execution');
  const expected = await execution.evaluate((node, value) => {
    const probe = document.createElement('span');
    probe.style.color = value;
    node.append(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved;
  }, color);
  await expect(execution).toHaveCSS('color', expected);
  const contrast = await execution.evaluate((node) => {
    const context = document.createElement('canvas').getContext('2d')!;
    const background = getComputedStyle(
      node.closest('.jp-CellInspector')!
    ).backgroundColor;
    const luminance = (color: string) => {
      context.fillStyle = background;
      context.fillRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data)
        .slice(0, 3)
        .map((value) => value / 255)
        .map((value) =>
          value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
        )
        .reduce(
          (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
          0
        );
    };
    const text = luminance(getComputedStyle(node).color);
    const surface = luminance(background);
    return (Math.max(text, surface) + 0.05) / (Math.min(text, surface) + 0.05);
  });
  expect(contrast).toBeGreaterThanOrEqual(4.5);
}

test('live names, inline keyboard editing, metadata preservation and reload', async ({
  page,
  request,
  notebook,
}) => {
  await expect(task(page)).toHaveText('Data preparation');
  await editor(page).click();
  await expect(task(page)).toHaveText('Data preparation');
  await editor(page).fill('#');
  await editor(page).pressSequentially('L');
  await expect(task(page)).toHaveText('L');
  await editor(page).pressSequentially('oad data');
  await expect(task(page)).toHaveText('Load data');
  await task(page).focus();
  await task(page).press('Enter');
  const input = inspector(page).getByRole('textbox', { name: 'Cell task' });
  await input.fill('Cancelled');
  await input.press('Escape');
  await expect(task(page)).toHaveText('Load data');
  await expect(task(page)).toBeFocused();
  await task(page).press('Enter');
  await input.fill('Prepare training data');
  await input.press('Enter');
  await expect(task(page)).toHaveText('Prepare training data');
  await expect(task(page)).toBeFocused();
  await page.evaluate(async () => {
    const app = (window as unknown as { jupyterapp: JupyterFrontEnd })
      .jupyterapp;
    await (app.shell.currentWidget as NotebookPanel).context.save();
  });
  const saved = await (
    await request.get(`/api/contents/${notebook.path}`)
  ).json();
  expect(saved.content.cells[1].metadata.jupyter).toEqual({
    cellInspector: { task: 'Prepare training data', note: 'preserve' },
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await ready(page);
  await editor(page).click();
  await expect(task(page)).toHaveText('Prepare training data');
  await task(page).click();
  await input.fill('');
  await editor(page).click();
  await expect(input).toBeHidden();
  await expect(task(page)).toHaveText('Load data');
  await page
    .evaluate(() => {
      const app = (window as unknown as { jupyterapp: JupyterFrontEnd })
        .jupyterapp;
      const panel = app.shell.currentWidget as NotebookPanel;
      const metadata = panel.content.activeCell!.model.getMetadata('jupyter');
      return metadata;
    })
    .then((metadata) =>
      expect(metadata).toEqual({ cellInspector: { note: 'preserve' } })
    );
});

test('heading and cell-type fallbacks update while typing', async ({
  page,
  notebook,
}) => {
  await cells(page).first().dblclick();
  await editor(page, 0).fill('#');
  await editor(page, 0).pressSequentially('M');
  await expect(task(page)).toHaveText('M');
  await editor(page).click();
  await expect(task(page)).toHaveText('M');
  await page.evaluate(() => {
    const app = (window as unknown as { jupyterapp: JupyterFrontEnd })
      .jupyterapp;
    const panel = app.shell.currentWidget as NotebookPanel;
    panel.content.widgets[0].model.sharedModel.setSource('No heading');
  });
  await expect(task(page)).toHaveText('Code cell');
  await expect(inspector(page).locator('.jp-CellInspector-lines')).toHaveText(
    '1 line'
  );
  await cells(page).last().click();
  await expect(task(page)).toHaveText('Raw cell');
  await expect(
    inspector(page).locator('.jp-CellInspector-executionStatus')
  ).toHaveText('Non-executable');
  await cells(page).first().click();
  await expect(task(page)).toHaveText('Markdown cell');
  expect(notebook.errors).toEqual([]);
});

for (const theme of ['JupyterLab Light', 'JupyterLab Dark']) {
  test(`execution colors, completion timestamps and reload fallback in ${theme}`, async ({
    page,
    request,
    notebook,
  }, testInfo) => {
    await page.evaluate(async (theme) => {
      const app = (window as unknown as { jupyterapp: JupyterFrontEnd })
        .jupyterapp;
      await app.commands.execute('apputils:change-theme', { theme });
    }, theme);
    await expect(page.locator('body')).toHaveAttribute(
      'data-jp-theme-light',
      String(theme === 'JupyterLab Light')
    );
    await page.clock.setFixedTime(new Date('2026-10-28T08:05:00-07:00'));
    await editor(page).fill('import time\ntime.sleep(3)\n42');
    const status = inspector(page).locator('.jp-CellInspector-executionStatus');
    const timer = inspector(page).locator('.jp-CellInspector-timer');
    const completed = inspector(page).locator(
      'time.jp-CellInspector-completedAt'
    );
    await expect(status).toHaveText('[ ] Not run');
    await expectExecutionColor(page, 'var(--jp-ui-font-color1)');
    await expect(completed).toBeHidden();
    await editor(page).press('ControlOrMeta+Enter');
    await expect(status).toHaveText('[*] Running');
    await expectExecutionColor(
      page,
      'color-mix(in srgb, var(--jp-warn-color1) 65%, var(--jp-ui-font-color0))'
    );
    await expect(completed).toBeHidden();
    await page.screenshot({ path: testInfo.outputPath('running.png') });
    await expect(timer).toHaveText(/00:0[1-9]/);
    await expect(status).toHaveText(/\[\d+\] Executed in/);
    await expectExecutionColor(
      page,
      'color-mix(in srgb, var(--jp-success-color1) 65%, var(--jp-ui-font-color0))'
    );
    await expect(completed).toBeVisible();
    await expect(completed).toHaveText(' · Last run: 08:05 28/10/2026');
    await expect(completed).toHaveAttribute(
      'datetime',
      '2026-10-28T15:05:00.000Z'
    );
    await expect(completed).toHaveAttribute('title', /local time/);
    const duration = await timer.textContent();
    await editor(page).press('Escape');
    await task(page).focus();
    await expect(timer).toHaveText(duration!);
    await expect(status).toHaveAttribute('aria-live', 'polite');
    await expect(timer).toHaveAttribute('aria-hidden', 'true');
    expect(
      await completed.evaluate((node) => node.closest('[aria-live]'))
    ).toBeNull();
    await page.screenshot({ path: testInfo.outputPath('completed.png') });
    await editor(page).fill('import time\ntime.sleep(3)\n43');
    await expect(status).toHaveText(/\[\d+\] Modified/);
    await expect(completed).toHaveText(' · Last run: 08:05 28/10/2026');
    await cells(page).nth(2).click();
    await expect(completed).toBeHidden();
    await editor(page).click();
    await expect(completed).toHaveText(' · Last run: 08:05 28/10/2026');
    await page.clock.setFixedTime(new Date('2027-01-01T00:04:00-08:00'));
    await editor(page).press('ControlOrMeta+Enter');
    await expect(status).toHaveText('[*] Running');
    await expect(completed).toBeHidden();
    await expect(status).toHaveText(/\[\d+\] Executed in/);
    await expect(completed).toHaveText(' · Last run: 00:04 01/01/2027');
    await expect(completed).toHaveAttribute(
      'datetime',
      '2027-01-01T08:04:00.000Z'
    );
    await page.setViewportSize({ width: 600, height: 800 });
    await expect.poll(() => rowCount(page)).toBe(1);
    await expect(completed).toBeHidden();
    await expect(
      inspector(page).locator('.jp-CellInspector-executionCompact')
    ).toHaveText('[2]');
    await expect(
      inspector(page).locator('.jp-CellInspector-executionCompact')
    ).toHaveAttribute('aria-hidden', 'true');
    const details = inspector(page).getByRole('button', {
      name: 'More cell information',
    });
    await details.focus();
    await details.press('Enter');
    await expect(
      inspector(page).locator('.jp-CellInspector-details')
    ).toHaveText('Type: Code · Lines: 3 · Last run: 00:04 01/01/2027');
    await page.setViewportSize({ width: 240, height: 800 });
    await expect.poll(() => rowCount(page)).toBe(2);
    expect(
      await inspector(page).evaluate(
        (node) => node.scrollWidth <= node.clientWidth
      )
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath('completed-narrow.png'),
    });
    await details.press('Escape');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(async () => {
      const app = (window as unknown as { jupyterapp: JupyterFrontEnd })
        .jupyterapp;
      await (app.shell.currentWidget as NotebookPanel).context.save();
    });
    const saved = await (
      await request.get(`/api/contents/${notebook.path}`)
    ).json();
    expect(saved.content.cells[1].metadata.jupyter).toEqual({
      cellInspector: { note: 'preserve' },
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await ready(page);
    await editor(page).click();
    await expect(status).toHaveText(/\[\d+\] Executed$/);
    await expect(timer).toBeEmpty();
    await expect(completed).toBeHidden();
    await editor(page).fill('43');
    await expect(status).toHaveText(/\[\d+\] Modified/);
    expect(notebook.errors).toEqual([]);
  });
}

for (const shortcut of ['Shift+Enter', 'Alt+Enter', 'Run button']) {
  test(`${shortcut} keeps the ribbon on the running cell until completion`, async ({
    page,
    notebook,
  }) => {
    if (shortcut === 'Shift+Enter') {
      await page.setViewportSize({ width: 600, height: 900 });
    }
    await editor(page).fill('# Slow task\nimport time\ntime.sleep(4)\n42');
    const runningCell = cells(page).nth(1);
    if (shortcut === 'Run button') {
      await page
        .getByRole('button', { name: /^Run this cell and advance/ })
        .click();
    } else {
      await editor(page).press(shortcut);
    }
    await expect(cells(page).nth(2)).toHaveClass(/jp-mod-active/);
    await expect(runningCell.locator('.jp-CellInspector')).toHaveCount(1);
    await expect(task(page)).toHaveText('Slow task');
    await expect(
      inspector(page).locator('.jp-CellInspector-executionStatus')
    ).toHaveText('[*] Running');
    await expect(inspector(page).locator('.jp-CellInspector-timer')).toHaveText(
      /00:0[1-9]/
    );
    await expect(
      inspector(page).locator('.jp-CellInspector-cursor')
    ).toBeHidden();
    await expect(inspector(page)).toHaveCount(1);
    await expect(cells(page).nth(2).locator('.jp-CellInspector')).toHaveCount(
      1
    );
    await expect(runningCell.locator('.jp-CellInspector')).toHaveCount(0);
    await runningCell.click();
    await expect(task(page)).toHaveText('Slow task');
    await expect(
      inspector(page).locator('.jp-CellInspector-executionStatus')
    ).toHaveText(/\[\d+\] Executed in/);
    expect(notebook.errors).toEqual([]);
  });
}

test('queued execution does not displace the current run', async ({
  page,
  notebook,
}) => {
  await cells(page).first().click();
  await page.evaluate(async () => {
    const app = (window as unknown as { jupyterapp: JupyterFrontEnd })
      .jupyterapp;
    await app.commands.execute('notebook:change-cell-to-code');
  });
  await editor(page, 0).fill('# Second request\nimport time\ntime.sleep(3)');
  await editor(page).fill('# First request\nimport time\ntime.sleep(5)');
  await editor(page).press('Shift+Enter');
  await expect(cells(page).nth(1).locator('.jp-CellInspector')).toHaveCount(1);

  // Queue an earlier cell: notebook order must not override the current run.
  await editor(page, 0).press('Shift+Enter');
  await expect(task(page)).toHaveText('First request');
  await expect(cells(page).nth(1)).toHaveClass(/jp-mod-active/);
  await expect(cells(page).nth(1).locator('.jp-CellInspector')).toHaveCount(1);
  await expect(cells(page).first().locator('.jp-InputPrompt')).toHaveText(
    '[*]:'
  );
  await expect(task(page)).toHaveText('Second request');
  await expect(cells(page).first().locator('.jp-CellInspector')).toHaveCount(1);
  await expect(inspector(page)).toHaveCount(1);
  await expect(task(page)).toHaveText('First request');
  await expect(
    inspector(page).locator('.jp-CellInspector-executionStatus')
  ).toHaveText(/\[\d+\] Executed in/);
  expect(notebook.errors).toEqual([]);
});

for (const outcome of ['error', 'interrupt']) {
  test(`${outcome} releases the running cell ribbon`, async ({
    page,
    notebook,
  }) => {
    await editor(page).fill(
      outcome === 'error'
        ? 'import time\ntime.sleep(3)\nraise ValueError("test failure")'
        : 'import time\nprint("neat-ready", flush=True)\ntime.sleep(60)'
    );
    await editor(page).press('Shift+Enter');
    await expect(cells(page).nth(1).locator('.jp-CellInspector')).toHaveCount(
      1
    );
    await expect(inspector(page).locator('.jp-CellInspector-timer')).toHaveText(
      /00:0[1-9]/
    );
    if (outcome === 'interrupt') {
      await expect(
        cells(page).nth(1).locator('.jp-OutputArea-output').first()
      ).toContainText('neat-ready');
      await page.evaluate(async () => {
        const app = (window as unknown as { jupyterapp: JupyterFrontEnd })
          .jupyterapp;
        const panel = app.shell.currentWidget as NotebookPanel;
        await panel.sessionContext.session!.kernel!.interrupt();
      });
    }
    await expect(cells(page).last().locator('.jp-CellInspector')).toHaveCount(
      1
    );
    await expect(inspector(page)).toHaveCount(1);
    await expect(
      inspector(page).locator('.jp-CellInspector-executionStatus')
    ).toHaveText('Non-executable');
    await expect(
      cells(page).nth(1).locator('.jp-OutputArea-output').last()
    ).toContainText(outcome === 'error' ? 'ValueError' : 'KeyboardInterrupt');
    expect(notebook.errors).toEqual([]);
  });
}

test('cursor, conditional wrapping, keyboard disclosure, themes and print', async ({
  page,
  notebook,
}, testInfo) => {
  await editor(page).fill('# Task\nvalue = 1\nvalue');
  await editor(page).press('ControlOrMeta+End');
  await expect(inspector(page).locator('.jp-CellInspector-lines')).toHaveText(
    '3 lines'
  );
  await expect(
    inspector(page).locator('.jp-CellInspector-cursorFull')
  ).toHaveText('Ln 3, Col 6');
  await expect(inspector(page)).toHaveCSS('position', 'sticky');
  await expect(inspector(page)).toHaveAttribute('role', 'group');
  await page.setViewportSize({ width: 600, height: 800 });
  await expect.poll(() => rowCount(page)).toBe(1);
  await expect(
    inspector(page).locator('.jp-CellInspector-cursorLine')
  ).toHaveText('Ln 3');
  await expect(inspector(page).locator('.jp-CellInspector-type')).toBeHidden();
  const details = inspector(page).getByRole('button', {
    name: 'More cell information',
  });
  await details.focus();
  await details.press('Enter');
  await expect(details).toHaveAttribute('aria-expanded', 'true');
  await expect(inspector(page).locator('.jp-CellInspector-details')).toHaveText(
    'Type: Code · Lines: 3'
  );
  await details.press('Escape');
  await expect(details).toHaveAttribute('aria-expanded', 'false');
  await expect(
    inspector(page).locator('.jp-CellInspector-cursor')
  ).toBeHidden();
  await page.setViewportSize({ width: 240, height: 800 });
  await expect.poll(() => rowCount(page)).toBe(2);
  expect(
    await inspector(page).evaluate(
      (node) => node.scrollWidth <= node.clientWidth
    )
  ).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('narrow.png') });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.evaluate(async () => {
    const app = (window as unknown as { jupyterapp: JupyterFrontEnd })
      .jupyterapp;
    await app.commands.execute('apputils:change-theme', {
      theme: 'JupyterLab Dark',
    });
  });
  await expect(page.locator('body')).toHaveAttribute(
    'data-jp-theme-light',
    'false'
  );
  await expect(inspector(page)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('dark.png') });
  await page.emulateMedia({ media: 'print' });
  await expect(inspector(page)).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
  expect(notebook.errors).toEqual([]);
});

test('hidden input, deleting a running cell and notebook disposal', async ({
  page,
  notebook,
}) => {
  await editor(page).fill('import time\ntime.sleep(3)');
  await page.evaluate(() => {
    const app = (window as unknown as { jupyterapp: JupyterFrontEnd })
      .jupyterapp;
    (app.shell.currentWidget as NotebookPanel).content.activeCell!.inputHidden =
      true;
  });
  await expect(inspector(page)).toBeVisible();
  await expect(editor(page)).toBeHidden();
  await page.evaluate(() => {
    const app = (window as unknown as { jupyterapp: JupyterFrontEnd })
      .jupyterapp;
    (app.shell.currentWidget as NotebookPanel).content.activeCell!.inputHidden =
      false;
  });
  await editor(page).press('Shift+Enter');
  await expect(
    inspector(page).locator('.jp-CellInspector-executionStatus')
  ).toHaveText('[*] Running');
  await expect(cells(page).last()).toHaveClass(/jp-mod-active/);
  await expect(cells(page).nth(1).locator('.jp-CellInspector')).toHaveCount(1);
  await page.evaluate(() => {
    const app = (window as unknown as { jupyterapp: JupyterFrontEnd })
      .jupyterapp;
    const panel = app.shell.currentWidget as NotebookPanel;
    panel.content.model!.sharedModel.deleteCell(1);
  });
  await expect(cells(page)).toHaveCount(2);
  await expect(inspector(page)).toHaveCount(1);
  await page.evaluate(() => {
    const app = (window as unknown as { jupyterapp: JupyterFrontEnd })
      .jupyterapp;
    (app.shell.currentWidget as NotebookPanel).dispose();
  });
  await expect(inspector(page)).toHaveCount(0);
  expect(notebook.errors).toEqual([]);
});

test('disposing a notebook removes its pinned running ribbon', async ({
  page,
  notebook,
}) => {
  // Isolate widget/timer disposal from the host debugger's busy-kernel teardown.
  await page.evaluate(async () => {
    const app = (window as unknown as { jupyterapp: JupyterFrontEnd })
      .jupyterapp;
    const panel = app.shell.currentWidget as NotebookPanel;
    await panel.sessionContext.session?.kernel?.info;
    (panel.content.widgets[1].model as ICodeCellModel).executionState =
      'running';
    panel.content.activeCellIndex = 2;
  });
  await expect(cells(page).nth(1).locator('.jp-CellInspector')).toHaveCount(1);
  await expect(inspector(page).locator('.jp-CellInspector-timer')).toHaveText(
    /00:0[1-9]/
  );
  await page.evaluate(() => {
    const app = (window as unknown as { jupyterapp: JupyterFrontEnd })
      .jupyterapp;
    (app.shell.currentWidget as NotebookPanel).dispose();
  });
  await expect(inspector(page)).toHaveCount(0);
  expect(notebook.errors).toEqual([]);
});

test('setting disables the extension and notebook switching does not duplicate it', async ({
  page,
  request,
  notebook,
}, testInfo) => {
  const endpoint = `/lab/api/settings/${encodeURIComponent(PLUGIN)}`;
  const settings = await request.get(endpoint);
  expect(settings.ok()).toBeTruthy();
  const original = await settings.json();
  try {
    expect(
      (await request.put(endpoint, { data: { raw: '{"enabled":false}' } })).ok()
    ).toBeTruthy();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await ready(page);
    await expect(inspector(page)).toHaveCount(0);
    await cells(page).last().click();
    await expect(inspector(page)).toHaveCount(0);
    expect(
      (await request.put(endpoint, { data: { raw: '{"enabled":true}' } })).ok()
    ).toBeTruthy();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await ready(page);
    await expect(inspector(page)).toHaveCount(1);
    if (testInfo.project.name.startsWith('lab-')) {
      const second = `neat-second-${randomUUID()}.ipynb`;
      await createNotebook(request, second);
      try {
        await page.evaluate(async (file) => {
          const app = (window as unknown as { jupyterapp: JupyterFrontEnd })
            .jupyterapp;
          await app.commands.execute('docmanager:open', { path: file });
        }, second);
        await ready(page);
        await expect(inspector(page)).toHaveCount(1);
        await page.evaluate(async (file) => {
          const app = (window as unknown as { jupyterapp: JupyterFrontEnd })
            .jupyterapp;
          await app.commands.execute('docmanager:open', { path: file });
        }, notebook.path);
        await ready(page);
        await expect(inspector(page)).toHaveCount(1);
      } finally {
        const sessions = await (await request.get('/api/sessions')).json();
        for (const session of sessions) {
          if (session.path === second) {
            await request.delete(`/api/sessions/${session.id}`);
          }
        }
        await request.delete(`/api/contents/${second}`);
      }
    }
  } finally {
    await request.put(endpoint, { data: { raw: original.raw } });
  }
  expect(notebook.errors).toEqual([]);
});
