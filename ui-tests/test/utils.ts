import { IJupyterLabPageFixture } from '@jupyterlab/galata';

/**
 * Run the selected cell and advance.
 */
export async function runAndAdvance(
  page: IJupyterLabPageFixture
): Promise<void> {
  await page.click(
    "//button[normalize-space(@title)='Run the selected cells and advance']"
  );
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
