/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

const merge = require('webpack-merge').default;
const config = require('./webpack.config');
const WPPlugin = require('@jupyterlab/builder').WPPlugin;
const TerserPlugin = require('terser-webpack-plugin');


config[0] = merge(config[0], {
  mode: 'production',
  devtool: 'source-map',
  output: {
    // Add version argument when in production so the Jupyter server
    // allows caching of files (i.e., does not set the CacheControl header to no-cache to prevent caching static files)
    filename: '[name].[contenthash].js?v=[contenthash]',
  },
  optimization: {
  minimize: true,
  minimizer: [
    new TerserPlugin({
      parallel: true,
      terserOptions: {
        compress: false,
        ecma: 6,
        mangle: true,
        output: {
          beautify: false,
          comments: false
        },
        safari10: true
      }
    })
  ]
},
  plugins: [
    new WPPlugin.JSONLicenseWebpackPlugin({
      excludedPackageTest: (packageName) =>
        packageName === '@jupyter-notebook/app',
    }),
  ],
});

module.exports = config;
