import { getPythonVersion, run } from '@jupyterlab/buildutils';

export function postbump(): void {
  // Commit the changes
  const newPyVersion = getPythonVersion();
  // Commit changes.
  run(`git commit -am "Release ${newPyVersion}"`);
}
