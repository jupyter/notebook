const path = require('path');

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
