import { readdirSync } from 'fs';

import { resolve } from 'path';

import { run } from '@jupyterlab/buildutils';

import commander from 'commander';

commander
  .description('Publish packages to npm')
  .option(
    '--dist <path>',
    'The path to the directory with the package tarballs'
  )
  .option('--dry-run', 'Run in dry-run mode')
  .action((options: any) => {
    const dryRun = options.dryRun ?? false;
    const distDir = resolve(options.dist);
    const files = readdirSync(distDir);
    files.forEach(file => {
      if (!file.endsWith('.tgz')) {
        return;
      }
      const tarball = resolve(distDir, file);
      run(`npm publish ${tarball} ${dryRun ? '--dry-run' : ''}`);
    });
  });

commander.parse(process.argv);
