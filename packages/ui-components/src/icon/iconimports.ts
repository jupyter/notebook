/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import { LabIcon } from '@jupyterlab/ui-components';

import jupyterSvgstr from '../../style/icons/jupyter.svg';

export const jupyterIcon = new LabIcon({
  name: 'classic-ui-components:jupyter',
  svgstr: jupyterSvgstr
});
