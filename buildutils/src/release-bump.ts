/* -----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

/**
 * Inspired by: https://github.com/jupyterlab/jupyterlab/blob/master/buildutils/src/bumpversion.ts
 */

import * as utils from '@jupyterlab/buildutils';

import commander from 'commander';

import {
  getPythonVersion,
  jsVersionToPythonVersion,
  normalizeJSVersion,
  postbump,
  syncWorkspaceVersions,
} from './utils';

// Specify the program signature.
commander
  .description('Update the version')
  .option('--dry-run', 'Dry run')
  .option('--force', 'Force the upgrade')
  .option('--skip-commit', 'Whether to skip commit changes')
  .arguments('<spec>')
  .action((spec: any, opts: any) => {
    // Get the previous version.
    const prev = getPythonVersion();
    const isFinal = /\d+\.\d+\.\d+$/.test(prev);

    // Whether to commit after bumping
    const commit = opts.skipCommit !== true;

    // for "next", determine whether to use "patch" or "build"
    if (spec === 'next') {
      spec = isFinal ? 'patch' : 'build';
    }

    // For patch, defer to `patch:release` command
    if (spec === 'patch') {
      let cmd = 'jlpm run release:patch';
      if (opts.force) {
        cmd += ' --force';
      }
      if (!commit) {
        cmd += ' --skip-commit';
      }
      utils.run(cmd);
      process.exit(0);
    }

    const symbolicSpecs = new Set(['major', 'minor', 'release', 'build']);

    // Make sure we have a valid version spec.
    if (!symbolicSpecs.has(spec)) {
      spec = jsVersionToPythonVersion(normalizeJSVersion(spec));
    }

    if (isFinal && spec === 'release') {
      throw new Error('Use "major" or "minor" to switch back to alpha release');
    }

    if (isFinal && spec === 'build') {
      throw new Error('Cannot increment a build on a final release');
    }

    // Run pre-bump script.
    utils.prebump();

    // Handle dry runs.
    if (opts.dryRun) {
      return;
    }

    if (!symbolicSpecs.has(spec)) {
      utils.run(`hatch version ${spec}`);
      syncWorkspaceVersions(getPythonVersion());
      postbump(commit);
      return;
    }

    // Bump the version.
    let pySpec = spec;
    if (spec === 'release') {
      if (prev.indexOf('a') !== -1) {
        pySpec = 'beta';
      } else if (prev.indexOf('b') !== -1) {
        pySpec = 'rc';
      } else if (prev.indexOf('rc') !== -1) {
        pySpec = 'release';
      } else {
        pySpec = 'alpha';
      }
    } else if (spec === 'build') {
      if (prev.indexOf('a') !== -1) {
        pySpec = 'a';
      } else if (prev.indexOf('b') !== -1) {
        pySpec = 'b';
      } else if (prev.indexOf('rc') !== -1) {
        pySpec = 'rc';
      }
    } else if (spec === 'major' || spec === 'minor') {
      pySpec = `${spec},alpha`;
    }
    utils.run(`hatch version ${pySpec}`);
    syncWorkspaceVersions(getPythonVersion());

    // Run the post-bump script.
    postbump(commit);
  });

commander.parse(process.argv);
