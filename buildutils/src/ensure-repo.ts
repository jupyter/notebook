import * as path from 'path';

import * as fs from 'fs-extra';

import { writePackageData } from '@jupyterlab/buildutils';

/**
 * Ensure the application package resolutions.
 */
function ensureResolutions(): string[] {
  const basePath = path.resolve('.');
  const corePath = path.join(basePath, 'app', 'package.json');
  const corePackage = fs.readJSONSync(corePath);

  corePackage.resolutions = {};

  const packages = Object.keys(corePackage.dependencies).concat(
    corePackage.jupyterlab.singletonPackages
  );

  packages.forEach(async (name) => {
    let version = '';
    try {
      const data = require(`${name}/package.json`);
      version = data.version;
    } catch {
      const modulePath = require.resolve(name);
      const parentDir = path.dirname(path.dirname(modulePath));
      const data = require(path.join(parentDir, 'package.json'));
      version = data.version;
    }
    // Insist on a restricted version in the yarn resolution.
    corePackage.resolutions[name] = `~${version}`;
  });

  // Write the package.json back to disk.
  if (writePackageData(corePath, corePackage)) {
    return ['Updated dev mode'];
  }
  return [];
}

if (require.main === module) {
  void ensureResolutions();
}
