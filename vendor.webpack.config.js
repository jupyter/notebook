// Support for Node 0.10
// See https://github.com/webpack/css-loader/issues/144
require('es6-promise').polyfill();
var _ = require('underscore');
var path = require('path');
var sourcemaps = 'inline-source-map';
var webpack = require('webpack');


if(process.argv.indexOf('-w') !== -1 || process.argv.indexOf('-w') !== -1  ){
  console.log('watch mode detected, will switch to cheep sourcemaps');
  sourcemaps = 'eval-source-map';

}
var commonConfig = {
    resolve: {
        root: [
            '.', /* allows npm packages to be loaded */
            './notebook/static'
        ].map(function(p) {return path.resolve(p);}),
        modulesDirectories: [
            "components", /* bower */
            "node_modules" /* npm */
        ]
    },
    bail: true,
    module: {
        loaders: [
            { test: /\.js$/, exclude: /node_modules|\/notebook\/static\/component/, loader: "babel-loader"},
            { test: /\.css$/, loader: "style-loader!css-loader" },
            { test: /\.json$/, loader: "json-loader" },
            // jquery-ui loads some images
            { test: /\.(jpg|png|gif)$/, loader: "file" },
            // required to load font-awesome
            { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&minetype=application/font-woff" },
            { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&minetype=application/font-woff" },
            { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&minetype=application/octet-stream" },
            { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file" },
            { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url?limit=10000&minetype=image/svg+xml" }
        ]
    },
    externals: {
      jquery: '$',
      bootstrap: '$',
      bootstraptour: 'Tour',
      'jquery-ui': '$',
      typeahead: '$.typeahead'
    }
};

function buildConfig(appName) {
    if (typeof appName !== 'string') return appName;
    var outputPath = path.join(__dirname, 'notebook', 'static', appName, 'js', 'built')
    return _.extend({}, commonConfig, {
        entry: {
            vendor: ['./notebook/static/' + appName + '/js/main.js']
        },
        output: {
            filename: 'vendor.min.js',
            path: outputPath,
            libraryTarget: 'var',
            library: 'vendor'
        },
        devtool: sourcemaps,
        plugins: [new webpack.DllPlugin({
            name: 'vendor',
            path: outputPath + '/vendor-manifest.json'
        })]
    });
}

module.exports = [
    'auth',
    'edit',
    'terminal',
    'tree',
    'notebook',
    _.extend({}, commonConfig, {
        entry: {
            vendor: ['./notebook/static/services/contents.js'],
        },
        output: {
            filename: 'vendor.js',
            path: path.join(__dirname, 'notebook', 'static', 'services', 'built'),
            libraryTarget: 'amd'
        },
        devtool: sourcemaps,
    }),
    _.extend({}, commonConfig, {
        entry: {
            vendor: ['./notebook/static/index.js'],
        },
        output: {
            filename: 'vendor.js',
            path: path.join(__dirname, 'notebook', 'static', 'built'),
            libraryTarget: 'amd'
        },
        devtool: sourcemaps,
    }),
].map(buildConfig);
