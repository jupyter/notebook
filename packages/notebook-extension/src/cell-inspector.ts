// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import {
  Cell,
  CodeCell,
  ICellModel,
  ICodeCellModel,
  MarkdownCell,
} from '@jupyterlab/cells';

import {
  INotebookTracker,
  Notebook,
  NotebookPanel,
} from '@jupyterlab/notebook';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { ITranslator, TranslationBundle } from '@jupyterlab/translation';

import { PanelLayout, Widget } from '@lumino/widgets';

const PLUGIN_ID = '@jupyter-notebook/notebook-extension:cell-inspector';

interface IExecutionTiming {
  startedAt?: number;
  lastDuration?: number;
}

/**
 * A widget displaying information about the active notebook cell.
 */
class CellInspector extends Widget {
  constructor(
    notebook: Notebook,
    cell: Cell,
    timing: IExecutionTiming,
    translator: ITranslator
  ) {
    super();
    this._notebook = notebook;
    this._cell = cell;
    this._timing = timing;
    this._trans = translator.load('notebook');

    this.addClass('jp-CellInspector');
    this.node.setAttribute(
      'aria-label',
      this._trans.__('Active cell inspector')
    );

    this._taskButton = document.createElement('button');
    this._taskButton.className = 'jp-CellInspector-task jp-CellInspector-item';
    this._taskButton.type = 'button';
    this._taskButton.title = this._trans.__('Edit cell task');
    this._taskButton.addEventListener('click', this._beginTaskEdit);

    this._taskInput = document.createElement('input');
    this._taskInput.className = 'jp-CellInspector-taskInput';
    this._taskInput.type = 'text';
    this._taskInput.setAttribute('aria-label', this._trans.__('Cell task'));
    this._taskInput.hidden = true;
    this._taskInput.addEventListener('blur', this._saveTaskEdit);
    this._taskInput.addEventListener('keydown', this._onTaskInputKeydown);

    this._type = document.createElement('span');
    this._type.className =
      'jp-CellInspector-type jp-CellInspector-item jp-CellInspector-secondary';

    this._lines = document.createElement('span');
    this._lines.className =
      'jp-CellInspector-lines jp-CellInspector-item jp-CellInspector-secondary';

    this._cursor = document.createElement('span');
    this._cursor.className = 'jp-CellInspector-cursor jp-CellInspector-item';

    this._cursorFull = document.createElement('span');
    this._cursorFull.className = 'jp-CellInspector-cursorFull';

    this._cursorLine = document.createElement('span');
    this._cursorLine.className = 'jp-CellInspector-cursorLine';

    this._cursor.append(this._cursorFull, this._cursorLine);

    this._execution = document.createElement('span');
    this._execution.className =
      'jp-CellInspector-execution jp-CellInspector-item';

    this._executionStatus = document.createElement('span');
    this._executionStatus.className = 'jp-CellInspector-executionStatus';
    this._executionStatus.setAttribute('aria-live', 'polite');
    this._executionStatus.setAttribute('aria-atomic', 'true');

    this._executionTimer = document.createElement('span');
    this._executionTimer.className = 'jp-CellInspector-timer';
    this._executionTimer.setAttribute('aria-hidden', 'true');

    this._execution.append(this._executionStatus, this._executionTimer);

    this._detailsButton = document.createElement('button');
    this._detailsButton.className =
      'jp-CellInspector-detailsButton jp-CellInspector-item';
    this._detailsButton.type = 'button';
    this._detailsButton.textContent = '…';
    this._detailsButton.title = this._trans.__('More cell information');
    this._detailsButton.setAttribute(
      'aria-label',
      this._trans.__('More cell information')
    );
    this._detailsButton.setAttribute('aria-expanded', 'false');
    this._detailsButton.addEventListener('click', this._toggleDetails);
    this._detailsButton.addEventListener(
      'keydown',
      this._onDetailsButtonKeydown
    );

    this._details = document.createElement('div');
    this._details.className = 'jp-CellInspector-details';
    this._details.id = `jp-CellInspector-details-${this._cell.model.id}`;
    this._details.hidden = true;
    this._detailsButton.setAttribute('aria-controls', this._details.id);

    this.node.append(
      this._taskButton,
      this._taskInput,
      this._type,
      this._lines,
      this._cursor,
      this._execution,
      this._detailsButton,
      this._details
    );

    this._cell.model.contentChanged.connect(this._onContentChanged);
    this._cell.model.metadataChanged.connect(this._onMetadataChanged);
    this._cell.model.selections.changed.connect(this._onSelectionChanged);
    this._cell.model.stateChanged.connect(this._onStateChanged);
    this._notebook.modelContentChanged.connect(this._onNotebookChanged);
    this._cell.node.addEventListener('focusin', this._onFocusChanged);
    this._cell.node.addEventListener('focusout', this._onFocusChanged);

    this._renderSummary();
    this._renderExecution();
    this._renderTask();
  }

  /**
   * Dispose of the inspector and all of its signal connections.
   */
  override dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this._stopTimer();
    this._cell.model.contentChanged.disconnect(this._onContentChanged);
    this._cell.model.metadataChanged.disconnect(this._onMetadataChanged);
    this._cell.model.selections.changed.disconnect(this._onSelectionChanged);
    this._cell.model.stateChanged.disconnect(this._onStateChanged);
    this._notebook.modelContentChanged.disconnect(this._onNotebookChanged);
    this._cell.node.removeEventListener('focusin', this._onFocusChanged);
    this._cell.node.removeEventListener('focusout', this._onFocusChanged);
    this._taskButton.removeEventListener('click', this._beginTaskEdit);
    this._taskInput.removeEventListener('blur', this._saveTaskEdit);
    this._taskInput.removeEventListener('keydown', this._onTaskInputKeydown);
    this._detailsButton.removeEventListener('click', this._toggleDetails);
    this._detailsButton.removeEventListener(
      'keydown',
      this._onDetailsButtonKeydown
    );

    super.dispose();
  }

  /**
   * Refresh the inspector after an external timing update.
   */
  refreshExecution(): void {
    this._renderExecution();
  }

  private _beginTaskEdit = (): void => {
    if (this._cell.readOnly) {
      return;
    }

    const explicitTask = Private.getExplicitTask(this._cell.model);
    this._taskEditCancelled = false;
    this._taskInput.value = explicitTask ?? '';
    this._taskInput.placeholder = this._taskButton.textContent ?? '';
    this._taskButton.hidden = true;
    this._taskInput.hidden = false;
    this._taskInput.focus();
    this._taskInput.select();
  };

  private _saveTaskEdit = (): void => {
    if (this._taskInput.hidden) {
      return;
    }

    this._taskInput.hidden = true;
    this._taskButton.hidden = false;

    if (!this._taskEditCancelled) {
      Private.setExplicitTask(this._cell.model, this._taskInput.value.trim());
    }
    this._taskEditCancelled = false;
    this._renderTask();
  };

  private _onTaskInputKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      this._taskInput.blur();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this._taskEditCancelled = true;
      this._taskInput.blur();
      this._taskButton.focus();
    }
  };

  private _toggleDetails = (): void => {
    const expanded =
      this._detailsButton.getAttribute('aria-expanded') === 'true';
    this._detailsButton.setAttribute('aria-expanded', String(!expanded));
    this._details.hidden = expanded;
  };

  private _onDetailsButtonKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && !this._details.hidden) {
      event.preventDefault();
      this._details.hidden = true;
      this._detailsButton.setAttribute('aria-expanded', 'false');
    }
  };

  private _onContentChanged = (): void => {
    this._renderSummary();
    this._renderTask();
  };

  private _onMetadataChanged = (): void => {
    this._taskButton.disabled = this._cell.readOnly;
    this._renderTask();
  };

  private _onSelectionChanged = (): void => {
    this._renderCursor();
  };

  private _onStateChanged = (): void => {
    this._renderExecution();
  };

  private _onNotebookChanged = (): void => {
    this._renderTask();
  };

  private _onFocusChanged = (): void => {
    window.requestAnimationFrame(() => {
      if (!this.isDisposed) {
        this._renderCursor();
      }
    });
  };

  private _renderSummary(): void {
    const source = this._cell.model.sharedModel.getSource();
    const lineCount = source.split('\n').length;
    const type = Private.typeLabel(this._cell.model, this._trans);
    const lines =
      lineCount === 1
        ? this._trans.__('%1 line', lineCount)
        : this._trans.__('%1 lines', lineCount);

    this._type.textContent = type.toUpperCase();
    this._lines.textContent = lines;
    this._details.textContent = this._trans.__(
      'Type: %1 · Lines: %2',
      type,
      lineCount
    );
    this._renderCursor();
  }

  private _renderCursor(): void {
    const editor = this._cell.editor;
    if (!editor?.hasFocus()) {
      this._cursor.hidden = true;
      this._cursorFull.textContent = '';
      this._cursorLine.textContent = '';
      return;
    }

    const cursor = editor.getCursorPosition();
    this._cursorFull.textContent = this._trans.__(
      'Ln %1, Col %2',
      cursor.line + 1,
      cursor.column + 1
    );
    this._cursorLine.textContent = this._trans.__('Ln %1', cursor.line + 1);
    this._cursor.hidden = false;
  }

  private _renderTask(): void {
    const explicitTask = Private.getExplicitTask(this._cell.model);
    const sourceTask =
      this._cell instanceof CodeCell
        ? Private.firstCodeLineTask(this._cell.model.sharedModel.getSource())
        : null;
    const task =
      explicitTask ??
      sourceTask ??
      Private.findMarkdownTask(this._notebook, this._cell) ??
      Private.fallbackTask(this._cell.model, this._trans);

    this._taskButton.textContent = task;
    this._taskButton.disabled = this._cell.readOnly;
  }

  private _renderExecution(): void {
    this.removeClass('jp-mod-running');
    this.removeClass('jp-mod-modified');

    if (!(this._cell instanceof CodeCell)) {
      this._setExecutionText(this._trans.__('Non-executable'), '');
      this._stopTimer();
      return;
    }

    const model = this._cell.model;
    const count = model.executionCount;

    if (model.executionState === 'running') {
      this.addClass('jp-mod-running');
      this._setExecutionText(
        this._trans.__('[*] Running'),
        Private.formatDuration(
          performance.now() - (this._timing.startedAt ?? performance.now())
        )
      );
      this._startTimer();
      return;
    }

    this._stopTimer();
    if (count === null) {
      this._setExecutionText(this._trans.__('[ ] Not run'), '');
    } else if (model.isDirty) {
      this.addClass('jp-mod-modified');
      this._setExecutionText(this._trans.__('[%1] Modified', count), '');
    } else if (this._timing.lastDuration !== undefined) {
      this._setExecutionText(
        this._trans.__('[%1] Executed in', count),
        Private.formatDuration(this._timing.lastDuration)
      );
    } else {
      this._setExecutionText(this._trans.__('[%1] Executed', count), '');
    }
  }

  private _setExecutionText(status: string, timer: string): void {
    if (this._executionStatus.textContent !== status) {
      this._executionStatus.textContent = status;
    }
    this._executionTimer.textContent = timer ? ` ${timer}` : '';
  }

  private _startTimer(): void {
    if (this._timer !== null) {
      return;
    }
    this._timer = window.setInterval(() => {
      if (!this.isDisposed) {
        this._renderExecution();
      }
    }, 1000);
  }

  private _stopTimer(): void {
    if (this._timer !== null) {
      window.clearInterval(this._timer);
      this._timer = null;
    }
  }

  private _cell: Cell;
  private _cursor: HTMLSpanElement;
  private _cursorFull: HTMLSpanElement;
  private _cursorLine: HTMLSpanElement;
  private _details: HTMLDivElement;
  private _detailsButton: HTMLButtonElement;
  private _execution: HTMLSpanElement;
  private _executionStatus: HTMLSpanElement;
  private _executionTimer: HTMLSpanElement;
  private _lines: HTMLSpanElement;
  private _notebook: Notebook;
  private _taskButton: HTMLButtonElement;
  private _taskEditCancelled = false;
  private _taskInput: HTMLInputElement;
  private _timer: number | null = null;
  private _timing: IExecutionTiming;
  private _trans: TranslationBundle;
  private _type: HTMLSpanElement;
}

/**
 * Manage the inspector and execution timing for one notebook panel.
 */
class CellInspectorManager {
  constructor(panel: NotebookPanel, translator: ITranslator, enabled: boolean) {
    this._panel = panel;
    this._notebook = panel.content;
    this._translator = translator;
    this._enabled = enabled;

    this._notebook.activeCellChanged.connect(this._onActiveCellChanged);
    this._notebook.renderingLayoutChanged.connect(this._onRenderingChanged);
    this._panel.disposed.connect(this.dispose);

    void Promise.all([panel.revealed, panel.context.ready]).then(() => {
      if (this._disposed) {
        return;
      }
      this._notebook.model?.cells.changed.connect(this._onCellsChanged);
      this._syncCellModels();
      void this._showInspector();
    });
  }

  get isDisposed(): boolean {
    return this._disposed;
  }

  set enabled(value: boolean) {
    if (value === this._enabled) {
      return;
    }
    this._enabled = value;
    void this._showInspector();
  }

  dispose = (): void => {
    if (this._disposed) {
      return;
    }
    this._disposed = true;

    this._inspector?.dispose();
    this._inspector = null;
    this._notebook.activeCellChanged.disconnect(this._onActiveCellChanged);
    this._notebook.renderingLayoutChanged.disconnect(this._onRenderingChanged);
    this._notebook.model?.cells.changed.disconnect(this._onCellsChanged);
    this._panel.disposed.disconnect(this.dispose);

    for (const [model, handler] of this._modelHandlers) {
      model.stateChanged.disconnect(handler);
    }
    this._modelHandlers.clear();
    this._timings.clear();
  };

  private _onActiveCellChanged = (): void => {
    void this._showInspector();
  };

  private _onRenderingChanged = (): void => {
    void this._showInspector(true);
  };

  private _onCellsChanged = (): void => {
    this._syncCellModels();
    void this._showInspector();
  };

  private _syncCellModels(): void {
    const models = new Set<ICellModel>();
    const cells = this._notebook.model?.cells;
    if (cells) {
      for (const model of cells) {
        models.add(model);
      }
    }

    for (const [model, handler] of this._modelHandlers) {
      if (!models.has(model)) {
        model.stateChanged.disconnect(handler);
        this._modelHandlers.delete(model);
        this._timings.delete(model.id);
      }
    }

    for (const model of models) {
      if (model.type !== 'code' || this._modelHandlers.has(model)) {
        continue;
      }
      const codeModel = model as ICodeCellModel;
      const handler = () => {
        this._updateTiming(codeModel);
        if (this._notebook.activeCell?.model === model) {
          this._inspector?.refreshExecution();
        }
      };
      this._modelHandlers.set(model, handler);
      model.stateChanged.connect(handler);
      this._updateTiming(codeModel);
    }
  }

  private _updateTiming(model: ICodeCellModel): void {
    const timing = this._timings.get(model.id) ?? {};
    if (model.executionState === 'running') {
      if (timing.startedAt === undefined) {
        timing.startedAt = performance.now();
        timing.lastDuration = undefined;
      }
    } else if (timing.startedAt !== undefined) {
      timing.lastDuration = performance.now() - timing.startedAt;
      timing.startedAt = undefined;
    }
    this._timings.set(model.id, timing);
  }

  private async _showInspector(force = false): Promise<void> {
    const request = ++this._showRequest;
    const cell = this._enabled ? this._notebook.activeCell : null;

    if (!cell) {
      this._inspector?.dispose();
      this._inspector = null;
      this._inspectedCell = null;
      return;
    }

    if (!force && this._inspectedCell === cell && this._inspector) {
      return;
    }

    await cell.ready;
    if (
      this._disposed ||
      request !== this._showRequest ||
      this._notebook.activeCell !== cell ||
      !this._enabled
    ) {
      return;
    }

    this._inspector?.dispose();
    const timing = this._timings.get(cell.model.id) ?? {};
    this._timings.set(cell.model.id, timing);
    const inspector = new CellInspector(
      this._notebook,
      cell,
      timing,
      this._translator
    );
    (cell.layout as PanelLayout).insertWidget(1, inspector);
    this._inspector = inspector;
    this._inspectedCell = cell;
  }

  private _disposed = false;
  private _enabled: boolean;
  private _inspectedCell: Cell | null = null;
  private _inspector: CellInspector | null = null;
  private _modelHandlers = new Map<ICellModel, () => void>();
  private _notebook: Notebook;
  private _panel: NotebookPanel;
  private _showRequest = 0;
  private _timings = new Map<string, IExecutionTiming>();
  private _translator: ITranslator;
}

/**
 * A plugin adding an information ribbon to the active notebook cell.
 */
export const cellInspector: JupyterFrontEndPlugin<void> = {
  id: PLUGIN_ID,
  description: 'Display information about the active notebook cell.',
  autoStart: true,
  requires: [INotebookTracker, ITranslator],
  optional: [ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
    tracker: INotebookTracker,
    translator: ITranslator,
    settingRegistry: ISettingRegistry | null
  ): void => {
    const managers = new Map<NotebookPanel, CellInspectorManager>();
    let enabled = true;

    const addManager = (panel: NotebookPanel): void => {
      if (managers.has(panel)) {
        return;
      }
      const manager = new CellInspectorManager(panel, translator, enabled);
      managers.set(panel, manager);
      panel.disposed.connect(() => {
        manager.dispose();
        managers.delete(panel);
      });
    };

    tracker.forEach(addManager);
    tracker.widgetAdded.connect((sender, panel) => {
      addManager(panel);
    });

    if (settingRegistry) {
      void Promise.all([settingRegistry.load(PLUGIN_ID), app.restored])
        .then(([settings]) => {
          const updateSettings = (): void => {
            enabled = settings.get('enabled').composite as boolean;
            for (const manager of managers.values()) {
              manager.enabled = enabled;
            }
          };
          updateSettings();
          settings.changed.connect(updateSettings);
        })
        .catch((reason: Error) => {
          console.error(
            `Failed to load settings for ${PLUGIN_ID}: ${reason.message}`
          );
        });
    }
  },
};

namespace Private {
  export function getExplicitTask(model: ICellModel): string | null {
    const jupyter = model.getMetadata('jupyter') as
      | {
          cellInspector?: { task?: unknown };
        }
      | undefined;
    const task = jupyter?.cellInspector?.task;
    return typeof task === 'string' && task.trim() ? task.trim() : null;
  }

  export function setExplicitTask(model: ICellModel, task: string): void {
    const jupyter = {
      ...((model.getMetadata('jupyter') as Record<string, unknown>) ?? {}),
    };
    const cellInspector = {
      ...((jupyter.cellInspector as Record<string, unknown>) ?? {}),
    };

    if (task) {
      cellInspector.task = task;
    } else {
      delete cellInspector.task;
    }

    if (Object.keys(cellInspector).length) {
      jupyter.cellInspector = cellInspector;
    } else {
      delete jupyter.cellInspector;
    }

    if (Object.keys(jupyter).length) {
      model.setMetadata('jupyter', jupyter);
    } else {
      model.deleteMetadata('jupyter');
    }
  }

  export function findMarkdownTask(
    notebook: Notebook,
    cell: Cell
  ): string | null {
    const activeIndex = notebook.widgets.indexOf(cell);
    const firstIndex =
      cell instanceof MarkdownCell ? activeIndex : activeIndex - 1;

    for (let index = firstIndex; index >= 0; index--) {
      const candidate = notebook.widgets[index];
      if (!(candidate instanceof MarkdownCell)) {
        continue;
      }
      const heading = firstMarkdownHeading(
        candidate.model.sharedModel.getSource()
      );
      if (heading) {
        return heading;
      }
    }
    return null;
  }

  export function firstMarkdownHeading(source: string): string | null {
    for (const sourceLine of source.split('\n')) {
      const match = /^\s{0,3}#{1,6}(?!#)[ \t]*(.*)$/.exec(sourceLine);
      const heading = match?.[1].replace(/[ \t]+#+[ \t]*$/, '').trim();
      if (heading) {
        return heading;
      }
    }
    return null;
  }

  export function firstCodeLineTask(source: string): string | null {
    const firstLine = source.split('\n', 1)[0];
    const match = /^\s*#+[ \t]*(.*)$/.exec(firstLine);
    const task = match?.[1].trim();
    return task || null;
  }

  export function typeLabel(
    model: ICellModel,
    trans: TranslationBundle
  ): string {
    switch (model.type) {
      case 'code':
        return trans.__('Code');
      case 'markdown':
        return trans.__('Markdown');
      case 'raw':
        return trans.__('Raw');
      default:
        return trans.__('Cell');
    }
  }

  export function fallbackTask(
    model: ICellModel,
    trans: TranslationBundle
  ): string {
    switch (model.type) {
      case 'code':
        return trans.__('Code cell');
      case 'markdown':
        return trans.__('Markdown cell');
      case 'raw':
        return trans.__('Raw cell');
      default:
        return trans.__('Cell');
    }
  }

  export function formatDuration(milliseconds: number): string {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);
    const paddedSeconds = String(seconds).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');

    if (hours > 0) {
      return `${String(hours).padStart(
        2,
        '0'
      )}:${paddedMinutes}:${paddedSeconds}`;
    }
    return `${paddedMinutes}:${paddedSeconds}`;
  }
}
