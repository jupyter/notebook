// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// Heavily inspired (and slightly tweaked) from:
// https://github.com/jupyterlab/jupyterlab/blob/master/examples/federated/core_package/webpack.config.js

const fs = require('fs-extra');
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge').default;
const { ModuleFederationPlugin } = webpack.container;
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;

const Build = require('@jupyterlab/builder').Build;
const baseConfig = require('@jupyterlab/builder/lib/webpack.config.base');

const data = require('./package.json');

const names = Object.keys(data.dependencies).filter(name => {
  const packageData = require(path.join(name, 'package.json'));
  return packageData.jupyterlab !== undefined;
});

// Ensure a clear build directory.
const buildDir = path.resolve(__dirname, 'build');
if (fs.existsSync(buildDir)) {
  fs.removeSync(buildDir);
}
fs.ensureDirSync(buildDir);

// Copy extra files
const index = path.resolve(__dirname, 'index.js');
const cssImports = path.resolve(__dirname, 'style.js');
fs.copySync(index, path.resolve(buildDir, 'index.js'));
fs.copySync(cssImports, path.resolve(buildDir, 'style.js'));

const extras = Build.ensureAssets({
  packageNames: names,
  output: buildDir
});

const singletons = {};

data.jupyterlab.singletonPackages.forEach(element => {
  singletons[element] = { singleton: true };
});

// Make a bootstrap entrypoint
const entryPoint = path.join(buildDir, 'bootstrap.js');
const bootstrap = 'import("./index.js");';
fs.writeFileSync(entryPoint, bootstrap);

if (process.env.NODE_ENV === 'production') {
  baseConfig.mode = 'production';
}

if (process.argv.includes('--analyze')) {
  extras.push(new BundleAnalyzerPlugin());
}

module.exports = [
  merge(baseConfig, {
    mode: 'development',
    entry: ['./publicpath.js', './' + path.relative(__dirname, entryPoint)],
    output: {
      path: path.resolve(__dirname, '..', 'jupyterlab_classic/static/'),
      library: {
        type: 'var',
        name: ['_JUPYTERLAB', 'CORE_OUTPUT']
      },
      filename: 'bundle.js'
    },
    plugins: [
      new ModuleFederationPlugin({
        library: {
          type: 'var',
          name: ['_JUPYTERLAB', 'CORE_LIBRARY_FEDERATION']
        },
        name: 'CORE_FEDERATION',
        shared: {
          ...data.resolutions,
          ...singletons
        }
      })
    ]
  })
].concat(extras);
