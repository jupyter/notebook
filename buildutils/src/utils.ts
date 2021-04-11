import { getPythonVersion, run } from '@jupyterlab/buildutils';

export function postbump(): void {
  // run the integrity
  run('jlpm integrity');

  const newPyVersion = getPythonVersion();
  // Commit changes.
  run(`git commit -am "Release ${newPyVersion}"`);
  run(`git tag ${newPyVersion}`);
}
