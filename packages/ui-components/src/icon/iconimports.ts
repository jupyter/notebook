/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import { LabIcon } from '@jupyterlab/ui-components';

import jupyterSvgstr from '../../style/icons/jupyter.svg';
import openInNewSvgstr from '../../style/icons/open-in-new.svg';

export const jupyterIcon = new LabIcon({
  name: 'notebook-ui-components:jupyter',
  svgstr: jupyterSvgstr,
});

export const openInNewIcon = new LabIcon({
  name: 'notebook-ui-components:open-in-new',
  svgstr: openInNewSvgstr,
});
