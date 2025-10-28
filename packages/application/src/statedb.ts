import { StateDB } from '@jupyterlab/statedb';
import {
  ReadonlyPartialJSONObject,
  ReadonlyPartialJSONValue,
} from '@lumino/coreutils';

/**
 * The default concrete implementation of a state database.
 */
export class NotebookStateDB extends StateDB<ReadonlyPartialJSONValue> {
  constructor(options: StateDB.IOptions<ReadonlyPartialJSONValue> = {}) {
    super(options);
    this._originalSave = super.save.bind(this);
  }

  // Override the save method to avoid saving the document widget (in main area).
  // NOTE: restoring a document widget open a new tab.
  async save(id: string, value: ReadonlyPartialJSONValue): Promise<void> {
    const data = (value as ReadonlyPartialJSONObject)[
      'data'
    ] as ReadonlyPartialJSONObject;

    // If data.path and data.factory are defined, the widget is a document widget, that
    // we don't want to save in the layout restoration.
    if (data?.['path'] && data?.['factory']) {
      return;
    } else {
      this._originalSave(id, value);
    }
  }

  private _originalSave: typeof StateDB.prototype.save;
}
