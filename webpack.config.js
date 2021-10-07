const path = require('path');
const crypto = require('crypto');

// Workaround for loaders using "md4" by default, which is not supported in FIPS-compliant OpenSSL
// See https://github.com/jupyterlab/jupyterlab/issues/11248
const cryptoOrigCreateHash = crypto.createHash;
crypto.createHash = (algorithm) =>
  cryptoOrigCreateHash(algorithm == 'md4' ? 'sha256' : algorithm);

module.exports = {
  entry: '@jupyterlab/apputils/lib/sanitizer',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'notebook/static/components/sanitizer'),
    libraryTarget: "amd"
  }
}
