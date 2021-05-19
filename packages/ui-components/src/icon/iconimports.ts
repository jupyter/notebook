/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import { LabIcon } from '@jupyterlab/ui-components';

import jupyterSvgstr from '../../style/icons/jupyter.svg';

import retroSvgstr from '../../style/icons/retrolab.svg';

export const jupyterIcon = new LabIcon({
  name: 'retro-ui-components:jupyter',
  svgstr: jupyterSvgstr
});

export const retroIcon = new LabIcon({
  name: 'retro-ui-components:retrolab',
  svgstr: retroSvgstr
});
