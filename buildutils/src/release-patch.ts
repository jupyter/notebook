/* -----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import commander from 'commander';

import * as utils from '@jupyterlab/buildutils';

function postbump() {
  // Commit the changes
  const newPyVersion = utils.getPythonVersion();
  // Commit changes.
  utils.run(`git commit -am "Release ${newPyVersion}"`);
}

// Specify the program signature.
commander
  .description('Create a patch release')
  .option('--force', 'Force the upgrade')
  .action((options: any) => {
    // Make sure we can patch release.
    const pyVersion = utils.getPythonVersion();
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
    utils.run('bumpversion patch'); // switches to alpha
    utils.run('bumpversion release --allow-dirty'); // switches to beta
    utils.run('bumpversion release --allow-dirty'); // switches to rc.
    utils.run('bumpversion release --allow-dirty'); // switches to final.

    // Version the changed
    let cmd =
      'jlpm run lerna version patch --no-push --force-publish --no-git-tag-version';
    if (options.force) {
      cmd += ' --yes';
    }
    utils.run(cmd);

    // Run post-bump actions.
    postbump();
  });

commander.parse(process.argv);
