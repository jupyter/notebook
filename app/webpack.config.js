// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// Heavily inspired (and slightly tweaked) from:
// https://github.com/jupyterlab/jupyterlab/blob/master/examples/federated/core_package/webpack.config.js

const fs = require('fs-extra');
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge').default;
const Handlebars = require('handlebars');
const { ModuleFederationPlugin } = webpack.container;
const BundleAnalyzerPlugin =
  require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const Build = require('@jupyterlab/builder').Build;
const WPPlugin = require('@jupyterlab/builder').WPPlugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const baseConfig = require('@jupyterlab/builder/lib/webpack.config.base');

const data = require('./package.json');

const names = Object.keys(data.dependencies).filter((name) => {
  const packageData = require(path.join(name, 'package.json'));
  return packageData.jupyterlab !== undefined;
});

// Ensure a clear build directory.
const buildDir = path.resolve(__dirname, 'build');
if (fs.existsSync(buildDir)) {
  fs.removeSync(buildDir);
}
fs.ensureDirSync(buildDir);

// Handle the extensions.
const { mimeExtensions, plugins } = data.jupyterlab;

// Create the list of extension packages from the package.json metadata
const extensionPackages = new Set();
Object.keys(plugins).forEach((page) => {
  const pagePlugins = plugins[page];
  Object.keys(pagePlugins).forEach((name) => {
    extensionPackages.add(name);
  });
});

Handlebars.registerHelper('json', function (context) {
  return JSON.stringify(context);
});

// custom help to check if a page corresponds to a value
Handlebars.registerHelper('ispage', function (key, page) {
  return key === page;
});

// custom helper to load the plugins on the index page
Handlebars.registerHelper('list_plugins', function () {
  let str = '';
  const page = this;
  Object.keys(this).forEach((extension) => {
    const plugin = page[extension];
    if (plugin === true) {
      str += `require(\'${extension}\'),\n  `;
    } else if (Array.isArray(plugin)) {
      const plugins = plugin.map((p) => `'${p}',`).join('\n');
      str += `
      require(\'${extension}\').default.filter(({id}) => [
       ${plugins}
      ].includes(id)),
      `;
    }
  });
  return str;
});

// Create the entry point and other assets in build directory.
const source = fs.readFileSync('index.template.js').toString();
const template = Handlebars.compile(source);
const extData = {
  notebook_plugins: plugins,
  notebook_mime_extensions: mimeExtensions,
};
const indexOut = template(extData);
fs.writeFileSync(path.join(buildDir, 'index.js'), indexOut);

// Copy extra files
const cssImports = path.resolve(__dirname, 'style.js');
fs.copySync(cssImports, path.resolve(buildDir, 'extraStyle.js'));

const extras = Build.ensureAssets({
  packageNames: names,
  output: buildDir,
  schemaOutput: path.resolve(__dirname, '..', 'notebook'),
});

/**
 * Create the webpack ``shared`` configuration
 */
function createShared(packageData) {
  // Set up module federation sharing config
  const shared = {};

  // Make sure any resolutions are shared
  for (let [pkg, requiredVersion] of Object.entries(packageData.resolutions)) {
    shared[pkg] = { requiredVersion };
  }

  // Add any extension packages that are not in resolutions (i.e., installed from npm)
  for (let pkg of extensionPackages) {
    if (!shared[pkg]) {
      shared[pkg] = {
        requiredVersion: require(`${pkg}/package.json`).version,
      };
    }
  }

  // Add dependencies and sharedPackage config from extension packages if they
  // are not already in the shared config. This means that if there is a
  // conflict, the resolutions package version is the one that is shared.
  const extraShared = [];
  for (let pkg of extensionPackages) {
    let pkgShared = {};
    let {
      dependencies = {},
      jupyterlab: { sharedPackages = {} } = {},
    } = require(`${pkg}/package.json`);
    for (let [dep, requiredVersion] of Object.entries(dependencies)) {
      if (!shared[dep]) {
        pkgShared[dep] = { requiredVersion };
      }
    }

    // Overwrite automatic dependency sharing with custom sharing config
    for (let [dep, config] of Object.entries(sharedPackages)) {
      if (config === false) {
        delete pkgShared[dep];
      } else {
        if ('bundled' in config) {
          config.import = config.bundled;
          delete config.bundled;
        }
        pkgShared[dep] = config;
      }
    }
    extraShared.push(pkgShared);
  }

  // Now merge the extra shared config
  const mergedShare = {};
  for (let sharedConfig of extraShared) {
    for (let [pkg, config] of Object.entries(sharedConfig)) {
      // Do not override the basic share config from resolutions
      if (shared[pkg]) {
        continue;
      }

      // Add if we haven't seen the config before
      if (!mergedShare[pkg]) {
        mergedShare[pkg] = config;
        continue;
      }

      // Choose between the existing config and this new config. We do not try
      // to merge configs, which may yield a config no one wants
      let oldConfig = mergedShare[pkg];

      // if the old one has import: false, use the new one
      if (oldConfig.import === false) {
        mergedShare[pkg] = config;
      }
    }
  }

  Object.assign(shared, mergedShare);

  // Transform any file:// requiredVersion to the version number from the
  // imported package. This assumes (for simplicity) that the version we get
  // importing was installed from the file.
  for (let [pkg, { requiredVersion }] of Object.entries(shared)) {
    if (requiredVersion && requiredVersion.startsWith('file:')) {
      shared[pkg].requiredVersion = require(`${pkg}/package.json`).version;
    }
  }

  // Add singleton package information
  for (let pkg of packageData.jupyterlab.singletonPackages) {
    if (shared[pkg]) {
      shared[pkg].singleton = true;
    }
  }

  return shared;
}

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

const htmlPlugins = [];
['consoles', 'edit', 'error', 'notebooks', 'terminals', 'tree'].forEach(
  (name) => {
    htmlPlugins.push(
      new HtmlWebpackPlugin({
        chunksSortMode: 'none',
        template: path.join(
          path.resolve('./templates'),
          `${name}_template.html`
        ),
        title: name,
        filename: path.join(
          path.resolve(__dirname, '..', 'notebook/templates'),
          `${name}.html`
        ),
      })
    );
  }
);

module.exports = [
  merge(baseConfig, {
    mode: 'development',
    entry: ['./publicpath.js', './' + path.relative(__dirname, entryPoint)],
    output: {
      path: path.resolve(__dirname, '..', 'notebook/static/'),
      publicPath: '{{page_config.fullStaticUrl}}/',
      library: {
        type: 'var',
        name: ['_JUPYTERLAB', 'CORE_OUTPUT'],
      },
      filename: '[name].[contenthash].js',
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          jlab_core: {
            test: /[\\/]node_modules[\\/]@(jupyterlab|jupyter-notebook|lumino(?!\/datagrid))[\\/]/,
            name: 'notebook_core',
          },
        },
      },
    },
    resolve: {
      fallback: { util: false },
    },
    plugins: [
      ...htmlPlugins,
      new WPPlugin.JSONLicenseWebpackPlugin({
        excludedPackageTest: (packageName) =>
          packageName === '@jupyter-notebook/app',
      }),
      new ModuleFederationPlugin({
        library: {
          type: 'var',
          name: ['_JUPYTERLAB', 'CORE_LIBRARY_FEDERATION'],
        },
        name: 'CORE_FEDERATION',
        shared: createShared(data),
      }),
    ],
  }),
].concat(extras);

const logPath = path.join(buildDir, 'build_log.json');
fs.writeFileSync(logPath, JSON.stringify(module.exports, null, '  '));
