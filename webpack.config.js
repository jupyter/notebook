const path = require('path');
const crypto = require('crypto');

// Workaround for loaders using "md4" by default, which is not supported in FIPS-compliant OpenSSL
// See https://github.com/jupyterlab/jupyterlab/issues/11248
const cryptoOrigCreateHash = crypto.createHash;
crypto.createHash = (algorithm) =>
  cryptoOrigCreateHash(algorithm == 'md4' ? 'sha256' : algorithm);

module.exports = {
  entry: ['babel-polyfill', '@jupyterlab/apputils/lib/sanitizer'],
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'notebook/static/components/sanitizer'),
    libraryTarget: "amd",
  },
  devtool: false,
  optimization: {
    minimize: false
  },
  module: {
    rules: [
      {
        test: /\.m?jsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          }
        }
      }
    ]
  }
}
