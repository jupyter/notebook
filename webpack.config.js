const path = require('path');

module.exports = {
  entry: '@jupyterlab/apputils/lib/sanitizer',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'notebook/static/components/sanitizer'),
    libraryTarget: "amd"
  }
}
