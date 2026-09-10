// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { expect, galata } from '@jupyterlab/galata';
import type { Page } from '@playwright/test';

import { test } from './fixtures';

async function getNotebookSessionState(page: Page, notebookPath: string) {
  return page.evaluate(async (path) => {
    const app = window.jupyterapp;
    await app.started;
    const currentWidget = app.shell.currentWidget as unknown as {
      sessionContext: {
        ready: Promise<void>;
        session: { id: string; kernel: unknown | null } | null;
      };
    };
    await currentWidget.sessionContext.ready;
    await app.serviceManager.sessions.refreshRunning();
    const sessions = Array.from(app.serviceManager.sessions.running()).filter(
      (session) => session.path === path
    );
    return {
      currentSessionId: currentWidget.sessionContext.session?.id ?? null,
      hasKernel: Boolean(currentWidget.sessionContext.session?.kernel),
      sessionIds: sessions.map((session) => session.id),
    };
  }, notebookPath);
}

async function openWithoutKernel(page: Page): Promise<Page> {
  await page.getByText('empty.ipynb').last().click({ button: 'right' });
  await page.getByText('Open With', { exact: true }).hover();

  const [notebook] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('menuitem', { name: 'Notebook (no kernel)' }).click(),
  ]);
  await notebook.waitForSelector('.jp-NotebookPanel');
  return notebook;
}

async function shutdownSession(page: Page, sessionId: string): Promise<void> {
  await page.evaluate(async (sessionId) => {
    await window.jupyterapp.started;
    await window.jupyterapp.serviceManager.sessions.shutdown(sessionId);
  }, sessionId);
}

test.describe('File Browser', () => {
  test.beforeEach(async ({ page, tmpPath }) => {
    await page.contents.uploadFile(
      path.resolve(__dirname, './notebooks/empty.ipynb'),
      `${tmpPath}/empty.ipynb`
    );
    await page.contents.createDirectory(`${tmpPath}/folder1`);
    await page.contents.createDirectory(`${tmpPath}/folder2`);
  });

  test('Select one folder', async ({ page, tmpPath }) => {
    await page.filebrowser.refresh();

    await page.keyboard.down('Control');
    await page.getByText('folder1').last().click();

    const toolbar = page.getByRole('toolbar');

    expect(toolbar.getByText('Rename')).toBeVisible();
    expect(toolbar.getByText('Move to Trash')).toBeVisible();
  });

  test('Select one file', async ({ page, tmpPath }) => {
    await page.filebrowser.refresh();

    await page.keyboard.down('Control');
    await page.getByText('empty.ipynb').last().click();

    const toolbar = page.getByRole('toolbar');

    ['Rename', 'Open', 'Download', 'Move to Trash'].forEach(async (text) => {
      expect(toolbar.getByText(text)).toBeVisible();
    });
  });

  test('Select files and folders', async ({ page, tmpPath }) => {
    await page.filebrowser.refresh();

    await page.keyboard.down('Control');
    await page.getByText('folder1').last().click();
    await page.getByText('folder2').last().click();
    await page.getByText('empty.ipynb').last().click();

    const toolbar = page.getByRole('toolbar');

    expect(toolbar.getByText('Rename')).toBeHidden();
    expect(toolbar.getByText('Open')).toBeHidden();
    expect(toolbar.getByText('Move to Trash')).toBeVisible();
  });

  test('Select files and open', async ({ page, tmpPath }) => {
    // upload an additional notebook
    await page.contents.uploadFile(
      path.resolve(__dirname, './notebooks/simple.ipynb'),
      `${tmpPath}/simple.ipynb`
    );
    await page.filebrowser.refresh();

    await page.keyboard.down('Control');
    await page.getByText('simple.ipynb').last().click();
    await page.getByText('empty.ipynb').last().click();

    const toolbar = page.getByRole('toolbar');

    const [nb1, nb2] = await Promise.all([
      page.waitForEvent('popup'),
      page.waitForEvent('popup'),
      toolbar.getByText('Open').last().click(),
    ]);

    await nb1.waitForLoadState();
    await nb1.close();

    await nb2.waitForLoadState();
    await nb2.close();
  });

  test('Open a file from its path', async ({ page, tmpPath }) => {
    await page.filebrowser.refresh();

    await page.getByRole('menuitem', { name: 'File' }).click();
    await page.getByRole('menuitem', { name: 'Open from Path' }).click();

    const dialog = page.locator('.jp-Dialog');
    await dialog.getByRole('textbox').fill(`${tmpPath}/empty.ipynb`);

    const [notebook] = await Promise.all([
      page.waitForEvent('popup'),
      dialog.getByRole('button', { name: 'Open' }).click(),
    ]);

    await notebook.waitForLoadState();
    expect(notebook.url()).toContain(`${tmpPath}/empty.ipynb`);
    await notebook.close();
  });

  test('No-auto-start opening still reuses an existing session', async ({
    page,
    tmpPath,
  }) => {
    const treeUrl = new URL(page.url());
    treeUrl.searchParams.set('notebookStartsKernel', 'false');
    await page.goto(treeUrl.toString());

    const notebookPath = `${tmpPath}/empty.ipynb`;
    let notebook: Page | null = null;
    let existingSessionId: string | null = null;
    try {
      existingSessionId = await page.evaluate(async (path) => {
        const app = window.jupyterapp;
        await app.started;
        const session = await app.serviceManager.sessions.startNew({
          path,
          name: '',
          type: 'notebook',
          kernel: { name: 'python3' },
        });
        const id = session.id;
        session.dispose();
        return id;
      }, notebookPath);

      await page.filebrowser.refresh();

      [notebook] = await Promise.all([
        page.waitForEvent('popup'),
        page.getByText('empty.ipynb').last().dblclick(),
      ]);

      await notebook.waitForSelector('.jp-NotebookPanel');
      expect(new URL(notebook.url()).searchParams.get('kernel')).not.toBe(
        'none'
      );

      const state = await getNotebookSessionState(notebook, notebookPath);
      expect(state.currentSessionId).toBe(existingSessionId);
      expect(state.hasKernel).toBe(true);
      expect(state.sessionIds).toEqual([existingSessionId]);
    } finally {
      try {
        if (notebook && !notebook.isClosed()) {
          await notebook.close();
        }
      } finally {
        if (existingSessionId) {
          await shutdownSession(page, existingSessionId);
        }
      }
    }
  });

  test('No-kernel launch reconnects after starting a kernel', async ({
    page,
    tmpPath,
  }) => {
    const notebookPath = `${tmpPath}/empty.ipynb`;
    await page.filebrowser.refresh();

    let notebook: Page | null = null;
    let startedSessionId: string | null = null;
    try {
      notebook = await openWithoutKernel(page);
      expect(new URL(notebook.url()).searchParams.get('kernel')).toBe('none');
      await expect(notebook.getByTitle('Switch kernel')).toHaveText(
        'No Kernel'
      );
      expect(await getNotebookSessionState(notebook, notebookPath)).toEqual({
        currentSessionId: null,
        hasKernel: false,
        sessionIds: [],
      });

      await notebook.reload();
      await notebook.waitForSelector('.jp-NotebookPanel');
      expect(new URL(notebook.url()).searchParams.get('kernel')).toBe('none');
      await expect(notebook.getByTitle('Switch kernel')).toHaveText(
        'No Kernel'
      );
      expect(await getNotebookSessionState(notebook, notebookPath)).toEqual({
        currentSessionId: null,
        hasKernel: false,
        sessionIds: [],
      });

      await notebook.evaluate(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('preserved', 'value');
        url.hash = 'preserved-fragment';
        window.history.replaceState(
          { ...window.history.state, preservedState: 'value' },
          '',
          url
        );
      });

      startedSessionId = await notebook.evaluate(async () => {
        const app = window.jupyterapp;
        await app.started;
        const currentWidget = app.shell.currentWidget as unknown as {
          sessionContext: {
            changeKernel(options: { name: string }): Promise<unknown>;
            session: { id: string } | null;
          };
        };
        await currentWidget.sessionContext.changeKernel({ name: 'python3' });
        return currentWidget.sessionContext.session?.id ?? null;
      });
      expect(startedSessionId).not.toBeNull();

      await expect
        .poll(() => new URL(notebook!.url()).searchParams.get('kernel'))
        .toBeNull();
      expect(new URL(notebook.url()).searchParams.get('preserved')).toBe(
        'value'
      );
      expect(new URL(notebook.url()).hash).toBe('#preserved-fragment');
      expect(
        await notebook.evaluate(() => window.history.state.preservedState)
      ).toBe('value');
      expect(await getNotebookSessionState(notebook, notebookPath)).toEqual({
        currentSessionId: startedSessionId,
        hasKernel: true,
        sessionIds: [startedSessionId],
      });

      await notebook.reload();
      await notebook.waitForSelector('.jp-NotebookPanel');

      await expect(notebook.getByTitle('Switch kernel')).not.toHaveText(
        'No Kernel'
      );
      expect(await getNotebookSessionState(notebook, notebookPath)).toEqual({
        currentSessionId: startedSessionId,
        hasKernel: true,
        sessionIds: [startedSessionId],
      });
    } finally {
      try {
        if (notebook && !notebook.isClosed()) {
          await notebook.close();
        }
      } finally {
        if (startedSessionId) {
          await shutdownSession(page, startedSessionId);
        }
      }
    }
  });

  test('Toggle the Date Created column from the header context menu', async ({
    page,
  }) => {
    await page.filebrowser.refresh();

    const header = page.locator('.jp-DirListing-header');
    const dateCreatedColumn = header.locator('.jp-id-created');
    await expect(dateCreatedColumn).toBeHidden();

    await header.click({ button: 'right' });
    await page.getByText('Show Date Created Column').click();

    await expect(dateCreatedColumn).toBeVisible();
  });
});

test.describe('File Browser settings', () => {
  test.use({
    mockSettings: {
      ...galata.DEFAULT_SETTINGS,
      '@jupyterlab/filebrowser-extension:browser': {
        showDateCreatedColumn: true,
      },
    },
  });

  test('Should show the Date Created column when enabled in the settings', async ({
    page,
  }) => {
    await page.filebrowser.refresh();

    const header = page.locator('.jp-DirListing-header');
    await expect(header.locator('.jp-id-created')).toBeVisible();
  });
});
