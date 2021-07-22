import { getPythonVersion, run } from '@jupyterlab/buildutils';

export function postbump(commit = true): void {
  // run the integrity
  run('jlpm integrity');

  const newPyVersion = getPythonVersion();

  // Commit changes.
  if (commit) {
    run(`git commit -am "Release ${newPyVersion}"`);
    run(`git tag ${newPyVersion}`);
  }
}
