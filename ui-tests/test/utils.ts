import { IJupyterLabPageFixture } from '@jupyterlab/galata';

import { Page } from '@playwright/test';

/**
 * Run the selected cell and advance.
 */
export async function runAndAdvance(
  page: IJupyterLabPageFixture | Page
): Promise<void> {
  await page.keyboard.press('Shift+Enter');
}

/**
 * Wait for the kernel to be ready
 */
export async function waitForKernelReady(
  page: IJupyterLabPageFixture
): Promise<void> {
  await page.waitForSelector('.jp-NotebookKernelStatus-fade');
  await page.waitForFunction(() => {
    const status = window.document.getElementsByClassName(
      'jp-NotebookKernelStatus'
    )[0];

    if (!status) {
      return false;
    }

    const finished = status?.getAnimations().reduce((prev, curr) => {
      return prev && curr.playState === 'finished';
    }, true);
    return finished;
  });
  if (page.viewportSize()?.width > 600) {
    await page.waitForSelector('.jp-DebuggerBugButton[aria-disabled="false"]');
  }
}

/**
 * Special case for firefox headless issue
 * See https://github.com/jupyter/notebook/pull/6872#issuecomment-1549594166 for more details
 */
export async function hideAddCellButton(
  page: IJupyterLabPageFixture
): Promise<void> {
  await page
    .locator('.jp-Notebook-footer')
    .evaluate((element) => (element.style.display = 'none'));
}
