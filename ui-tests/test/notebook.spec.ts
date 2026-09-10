// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import path from 'path';

import { expect, galata } from '@jupyterlab/galata';

import { test } from './fixtures';

import { waitForNotebook, runAndAdvance, waitForKernelReady } from './utils';

const NOTEBOOK = 'example.ipynb';

test.use({ autoGoto: false });

test.describe('Notebook', () => {
  test.beforeEach(async ({ page, tmpPath }) => {
    await page.contents.uploadFile(
      path.resolve(__dirname, `../../binder/${NOTEBOOK}`),
      `${tmpPath}/${NOTEBOOK}`
    );
  });

  test('Title should be rendered', async ({ page, tmpPath }) => {
    await page.goto(`notebooks/${tmpPath}/${NOTEBOOK}`);
    const href = await page.evaluate(() => {
      return document.querySelector('#jp-NotebookLogo')?.getAttribute('href');
    });
    expect(href).toContain('/tree');
  });

  test('Renaming the notebook should be possible', async ({
    page,
    tmpPath,
  }) => {
    const notebook = `${tmpPath}/${NOTEBOOK}`;
    await page.goto(`notebooks/${notebook}`);

    // Click on the title (with .ipynb extension stripped)
    await page.click('text="example"');

    // Rename in the input dialog
    const newName = 'test.ipynb';
    const newNameStripped = 'test';
    await page
      .locator(`text=File Path${NOTEBOOK}New Name >> input`)
      .fill(newName);

    await Promise.all([
      await page.click('text="Rename"'),
      // wait until the URL is updated
      await page.waitForNavigation(),
    ]);

    // Check the URL contains the new name
    const url = page.url();
    expect(url).toContain(newNameStripped);
  });

  // TODO: rewrite with page.notebook when fixed upstream in Galata
  // and usable in Jupyter Notebook without active tabs
  test('Outputs should be scrolled automatically', async ({
    page,
    tmpPath,
  }) => {
    const notebook = 'autoscroll.ipynb';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    // wait for the checkpoint indicator to be displayed before executing the cells
    await page.waitForSelector('.jp-NotebookCheckpoint');
    await page.click('.jp-Notebook');

    // execute the first cell
    await runAndAdvance(page);
    await page
      .locator('.jp-mod-outputsScrolled')
      .nth(0)
      .waitFor({ state: 'visible' });

    // execute the second cell
    await runAndAdvance(page);
    // the second cell should not be auto scrolled
    expect(page.locator('.jp-mod-outputsScrolled').nth(1)).toHaveCount(0);

    const checkCell = async (n: number): Promise<boolean> => {
      const scrolled = await page.$eval(`.jp-Notebook-cell >> nth=${n}`, (el) =>
        el.classList.contains('jp-mod-outputsScrolled')
      );
      return scrolled;
    };

    // check the long output area is auto scrolled
    expect(await checkCell(0)).toBe(true);

    // check the short output area is not auto scrolled
    expect(await checkCell(1)).toBe(false);
  });

  test('Open table of content left panel', async ({ page, tmpPath }) => {
    const notebook = 'simple_toc.ipynb';
    const menuPath = 'View>Left Sidebar>Show Table of Contents';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    await waitForKernelReady(page);

    await page.menu.clickMenuItem(menuPath);

    const panel = page.locator('#jp-left-stack');
    expect(await panel.isVisible()).toBe(true);

    await expect(
      panel.locator(
        '.jp-SidePanel-content > .jp-TableOfContents-tree > .jp-TableOfContents-content'
      )
    ).toHaveCount(1);
    await expect(
      panel.locator(
        '.jp-SidePanel-content > .jp-TableOfContents-tree > .jp-TableOfContents-content > .jp-tocItem'
      )
    ).toHaveCount(3);

    const imageName = 'toc-left-panel.png';

    expect(await panel.screenshot()).toMatchSnapshot(imageName);
  });

  test('Open notebook tools right panel', async ({ page, tmpPath }) => {
    const notebook = 'simple.ipynb';
    const menuPath = 'View>Right Sidebar>Show Notebook Tools';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    await waitForKernelReady(page);

    await page.menu.clickMenuItem(menuPath);

    const panel = page.locator('#jp-right-stack');
    expect(await panel.isVisible()).toBe(true);

    await page.isVisible('#notebook-tools.jp-NotebookTools');

    await page.isVisible('#notebook-tools.jp-NotebookTools > #add-tag.tag');

    const imageName = 'notebooktools-right-panel.png';
    expect(await panel.screenshot()).toMatchSnapshot(imageName);
  });

  test('Clicking on "Close and Shut Down Notebook" should close the browser tab', async ({
    page,
    tmpPath,
  }) => {
    const notebook = 'simple.ipynb';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    const menuPath = 'File>Close and Halt';
    await page.menu.clickMenuItem(menuPath);

    // Press Enter to confirm the dialog
    await page.keyboard.press('Enter');

    expect(page.isClosed());
  });

  test('Toggle the full width of the notebook', async ({
    page,
    browserName,
    tmpPath,
  }) => {
    const notebook = 'simple.ipynb';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    const menuPath = 'View>Enable Full Width Notebook';
    await page.menu.clickMenuItem(menuPath);

    const notebookPanel = page.locator('.jp-NotebookPanel').first();
    await expect(notebookPanel).toHaveClass(/jp-mod-fullwidth/);

    // click to make the blue border around the cell disappear
    await page.click('.jp-WindowedPanel-outer');

    // wait for the notebook to be ready
    await waitForNotebook(page, browserName);

    expect(await page.screenshot()).toMatchSnapshot('notebook-full-width.png');

    // undo the full width
    await page.menu.clickMenuItem(menuPath);
    await expect(notebookPanel).not.toHaveClass(/jp-mod-fullwidth/);
  });

  test('Open the log console widget in the down area', async ({
    page,
    tmpPath,
  }) => {
    const notebook = 'simple.ipynb';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    const menuPath = 'View>Show Log Console';
    await page.menu.clickMenuItem(menuPath);

    await expect(page.locator('.jp-LogConsole')).toBeVisible();
  });

  test('Toggle cell outputs with the O keyboard shortcut', async ({
    page,
    tmpPath,
  }) => {
    const notebook = 'autoscroll.ipynb';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    await waitForKernelReady(page);

    // Wait for the first cell to be active
    const firstCell = page.locator('.jp-Cell').first();
    await expect(firstCell).toHaveClass(/jp-mod-active/);

    // focus the notebook so keyboard shortcuts are handled
    await firstCell.locator('.jp-InputArea-prompt').click();
    await expect(firstCell).toBeFocused();

    // run the two cells
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.press('ControlOrMeta+Enter');

    await expect(page.locator('.jp-OutputArea-output')).toHaveCount(2, {
      timeout: 30000,
    });

    await page.keyboard.press('Escape');
    await page.keyboard.press('O');

    await page.waitForSelector('.jp-OutputPlaceholder', { state: 'visible' });

    await page.keyboard.press('O');

    await page.waitForSelector('.jp-OutputPlaceholder', { state: 'hidden' });
  });

  test('Active cell inspector shows cell details and persists a task label', async ({
    page,
    tmpPath,
  }) => {
    const notebook = 'cell_inspector.ipynb';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    await waitForKernelReady(page);

    const cells = page.locator('.jp-Notebook-cell');
    const inspector = page.locator('.jp-CellInspector');

    await cells.nth(0).click();
    await expect(inspector.locator('.jp-CellInspector-task')).toHaveText(
      'Data preparation'
    );
    await expect(inspector).toHaveCSS('position', 'sticky');
    await expect(inspector).toHaveCSS('border-left-width', '3px');
    await page.keyboard.press('Enter');
    const markdownEditor = cells
      .nth(0)
      .locator('.cm-content[contenteditable="true"]');
    await markdownEditor.fill('Introductory text\n#');
    await markdownEditor.pressSequentially('U');
    await expect(inspector.locator('.jp-CellInspector-task')).toHaveText('U');
    await markdownEditor.pressSequentially('pdated data preparation');
    await expect(inspector.locator('.jp-CellInspector-task')).toHaveText(
      'Updated data preparation'
    );

    await cells.nth(1).click();

    await expect(inspector).toHaveCount(1);
    await expect(cells.nth(1).locator('.jp-CellInspector')).toHaveCount(1);
    await expect(inspector.locator('.jp-CellInspector-task')).toHaveText(
      'Updated data preparation'
    );
    await expect(inspector.locator('.jp-CellInspector-type')).toHaveText(
      'CODE'
    );
    await expect(inspector.locator('.jp-CellInspector-lines')).toHaveText(
      '3 lines'
    );
    await expect(
      inspector.locator('.jp-CellInspector-executionStatus')
    ).toHaveText('[ ] Not run');

    const codeEditor = cells
      .nth(1)
      .locator('.cm-content[contenteditable="true"]');
    await codeEditor.fill('#');
    await codeEditor.pressSequentially('L');
    await expect(inspector.locator('.jp-CellInspector-task')).toHaveText('L');
    await codeEditor.pressSequentially('oad source data');
    await expect(inspector.locator('.jp-CellInspector-task')).toHaveText(
      'Load source data'
    );
    await codeEditor.fill('# Load source data\nvalue = 1\nvalue');

    await inspector.locator('.jp-CellInspector-task').click();
    const taskInput = inspector.locator('.jp-CellInspector-taskInput');
    await taskInput.fill('Explicit source task');
    await taskInput.press('Enter');
    await expect(inspector.locator('.jp-CellInspector-task')).toHaveText(
      'Explicit source task'
    );

    await page.keyboard.press('ControlOrMeta+s');
    await page.waitForTimeout(1000);
    await page.reload({ waitUntil: 'networkidle' });
    await cells.nth(1).click();
    await expect(page.locator('.jp-CellInspector-task')).toHaveText(
      'Explicit source task'
    );

    await cells.nth(2).click();
    await expect(inspector).toHaveCount(1);
    await expect(cells.nth(2).locator('.jp-CellInspector')).toHaveCount(1);
    await expect(
      inspector.locator('.jp-CellInspector-executionStatus')
    ).toHaveText('Non-executable');

    await page.setViewportSize({ width: 600, height: 800 });
    await cells.nth(1).locator('.cm-content[contenteditable="true"]').click();
    await page.keyboard.press('Control+End');
    await expect(inspector.locator('.jp-CellInspector-type')).toBeHidden();
    await expect(inspector.locator('.jp-CellInspector-lines')).toBeHidden();
    await expect(
      inspector.locator('.jp-CellInspector-cursorFull')
    ).toBeHidden();
    await expect(inspector.locator('.jp-CellInspector-cursorLine')).toHaveText(
      'Ln 3'
    );

    const detailsButton = inspector.locator('.jp-CellInspector-detailsButton');
    await expect(detailsButton).toBeVisible();
    await detailsButton.click();
    await expect(detailsButton).toHaveAttribute('aria-expanded', 'true');
    await expect(inspector.locator('.jp-CellInspector-details')).toHaveText(
      'Type: Code · Lines: 3'
    );
    await detailsButton.click();

    const visibleRowCount = async (): Promise<number> =>
      inspector
        .locator(':scope > .jp-CellInspector-item')
        .evaluateAll((items) => {
          const tops = items
            .filter((item) => item.getClientRects().length > 0)
            .map((item) => {
              const rect = item.getBoundingClientRect();
              return Math.round(rect.top + rect.height / 2);
            });
          return new Set(tops).size;
        });

    await expect.poll(visibleRowCount).toBe(1);
    await page.setViewportSize({ width: 240, height: 800 });
    await expect.poll(visibleRowCount).toBe(2);
    expect(
      await inspector.evaluate((node) => node.scrollWidth <= node.clientWidth)
    ).toBe(true);
  });

  test('Active cell inspector updates the cursor and execution timer', async ({
    page,
    tmpPath,
  }) => {
    const notebook = 'cell_inspector.ipynb';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    await waitForKernelReady(page);

    const codeCell = page.locator('.jp-Notebook-cell').nth(1);
    const editor = codeCell.locator(
      '.jp-Cell-inputArea .cm-content[contenteditable="true"]'
    );
    await editor.click();
    await page.keyboard.press('Control+End');

    const inspector = codeCell.locator('.jp-CellInspector');
    await expect(inspector.locator('.jp-CellInspector-cursor')).toContainText(
      'Ln 3'
    );

    await page.keyboard.press('ControlOrMeta+Enter');
    await expect(
      inspector.locator('.jp-CellInspector-executionStatus')
    ).toHaveText('[*] Running');
    await expect(inspector.locator('.jp-CellInspector-timer')).toHaveText(
      /00:0[1-9]/
    );
    await expect(
      inspector.locator('.jp-CellInspector-executionStatus')
    ).toHaveText(/\[\d+\] Executed in/);
    await expect(inspector.locator('.jp-CellInspector-timer')).toHaveText(
      /00:0[2-9]/
    );

    await page.keyboard.press('Escape');
    await expect(inspector.locator('.jp-CellInspector-cursor')).toBeHidden();
  });

  test('Help pager should open in down area with question mark syntax', async ({
    page,
    tmpPath,
  }) => {
    const notebook = 'empty.ipynb';
    await page.contents.uploadFile(
      path.resolve(__dirname, `./notebooks/${notebook}`),
      `${tmpPath}/${notebook}`
    );
    await page.goto(`notebooks/${tmpPath}/${notebook}`);

    await waitForKernelReady(page);

    await page.click('.jp-Cell-inputArea');

    // Enter code in the first cell
    await page.locator(
      '.jp-Cell-inputArea >> .cm-editor >> .cm-content[contenteditable="true"]'
    ).type(`import math

math.pi?`);

    // Run the cell
    runAndAdvance(page);

    // The help should be displayed in the down area
    const helpPanel = page.locator('#jp-help-panel');
    await expect(helpPanel).toBeVisible();
    await expect(helpPanel).toContainText('3.14');

    // The cell output should remain empty
    const cellOutput = page.locator('.jp-Cell-outputArea');
    await expect(cellOutput.first()).toBeEmpty();
  });

  test.describe('Help pager disabled', () => {
    test.use({
      mockSettings: {
        ...galata.DEFAULT_SETTINGS,
        '@jupyterlab/notebook-extension:tracker': {
          helpInBottomPanel: false,
        },
      },
    });

    test('Help should be displayed in the cell output', async ({
      page,
      tmpPath,
    }) => {
      const notebook = 'empty.ipynb';
      await page.contents.uploadFile(
        path.resolve(__dirname, `./notebooks/${notebook}`),
        `${tmpPath}/${notebook}`
      );
      await page.goto(`notebooks/${tmpPath}/${notebook}`);

      await waitForKernelReady(page);

      await page.click('.jp-Cell-inputArea');

      // Enter code in the first cell
      await page.locator(
        '.jp-Cell-inputArea >> .cm-editor >> .cm-content[contenteditable="true"]'
      ).type(`import math

math.pi?`);

      // Run the cell
      runAndAdvance(page);

      // The help should be displayed inline in the cell output
      const cellOutput = page.locator('.jp-Cell-outputArea');
      await expect(cellOutput.first()).toContainText('3.14');

      // The help panel should not be opened
      await expect(page.locator('#jp-help-panel')).toHaveCount(0);
    });
  });
});
