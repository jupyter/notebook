/* -----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import commander from 'commander';

import { packPublicWorkspaces } from './utils';

commander.description('Pack all public workspace packages').action(() => {
  packPublicWorkspaces();
});

commander.parse(process.argv);
