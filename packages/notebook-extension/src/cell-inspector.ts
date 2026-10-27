// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { createCellInspectorPlugin } from 'neat-notebook';

// Preserve the bundled plugin's ID and settings for existing Notebook users.
export const cellInspector = createCellInspectorPlugin(
  '@jupyter-notebook/notebook-extension:cell-inspector'
);
