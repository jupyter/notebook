/* -----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import commander from 'commander';

import { syncWorkspaceVersions } from './utils';

commander
  .description('Set the JavaScript workspace package versions')
  .arguments('<version>')
  .action((version: string) => {
    syncWorkspaceVersions(version);
  });

commander.parse(process.argv);
