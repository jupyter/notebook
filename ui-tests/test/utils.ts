import { IJupyterLabPageFixture } from '@jupyterlab/galata';

import { Page } from '@playwright/test';

/**
 * Run the selected cell and advance.
 */
export async function runAndAdvance(
  page: IJupyterLabPageFixture | Page
): Promise<void> {
  await page.click(".jp-Toolbar-item [data-icon='ui-components:run']");
}

/**
 * Wait for the kernel to be ready
 */
export async function waitForKernelReady(
  page: IJupyterLabPageFixture
): Promise<void> {
  await page.waitForSelector('.jp-RetroKernelStatus-fade');
  await page.waitForFunction(() => {
    const status = window.document.getElementsByClassName(
      'jp-RetroKernelStatus'
    )[0];

    if (!status) {
      return false;
    }

    const finished = status?.getAnimations().reduce((prev, curr) => {
      return prev && curr.playState === 'finished';
    }, true);
    return finished;
  });
}
