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

  corePackage.jupyterlab.mimeExtensions = {};
  corePackage.jupyterlab.linkedPackages = {};
  corePackage.resolutions = {};

  const packages = Object.keys(corePackage.dependencies).concat(
    corePackage.jupyterlab.singletonPackages
  );

  packages.forEach(name => {
    const data = require(`${name}/package.json`);
    // Insist on a restricted version in the yarn resolution.
    corePackage.resolutions[name] = `~${data.version}`;
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
