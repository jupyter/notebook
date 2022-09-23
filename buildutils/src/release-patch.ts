/* -----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

/**
 * Inspired by: https://github.com/jupyterlab/jupyterlab/blob/master/buildutils/src/patch-release.ts
 */

import * as utils from '@jupyterlab/buildutils';

import commander from 'commander';

import { getPythonVersion, postbump } from './utils';

// Specify the program signature.
commander
  .description('Create a patch release')
  .option('--force', 'Force the upgrade')
  .option('--skip-commit', 'Whether to skip commit changes')
  .action((options: any) => {
    // Make sure we can patch release.
    const pyVersion = getPythonVersion();
    if (
      pyVersion.includes('a') ||
      pyVersion.includes('b') ||
      pyVersion.includes('rc')
    ) {
      throw new Error('Can only make a patch release from a final version');
    }

    // Run pre-bump actions.
    utils.prebump();

    // Patch the python version
    utils.run('hatch version patch');

    // Version the changed
    let cmd =
      'jlpm run lerna version patch --no-push --force-publish --no-git-tag-version';
    if (options.force) {
      cmd += ' --yes';
    }
    utils.run(cmd);

    // Whether to commit after bumping
    const commit = options.skipCommit !== true;
    postbump(commit);
  });

commander.parse(process.argv);
