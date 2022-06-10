/* -----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import commander from 'commander';

import fs from 'fs-extra';

import path from 'path';

import process from 'process';

import { run } from '@jupyterlab/buildutils';

commander
  .description('Setup the repository for develop mode')
  .option('--overwrite', 'Force linking the notebook schemas')
  .option('--source', 'The path to the notebook package')
  .action((options: any) => {
    const { overwrite } = options;
    const prefix = run(
      'python -c "import sys; print(sys.prefix)"',
      {
        stdio: 'pipe'
      },
      true
    );
    const source = path.resolve(options.source ?? process.cwd());
    const sourceDir = path.join(
      source,
      'notebook',
      'schemas',
      '@jupyter-notebook'
    );
    const destDir = path.join(
      prefix,
      'share',
      'jupyter',
      'lab',
      'schemas',
      '@jupyter-notebook'
    );
    if (overwrite) {
      try {
        fs.removeSync(destDir);
        console.log('Removed previous destination:', destDir);
      } catch (e) {
        console.info('Skip unlink', destDir);
      }
    }
    console.log('Symlinking:', sourceDir, destDir);
    fs.symlinkSync(sourceDir, destDir, 'dir');
  });

commander.parse(process.argv);
