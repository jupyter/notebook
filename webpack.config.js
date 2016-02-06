var _ = require('underscore');
var path = require('path');

var commonConfig = {
    resolve: {
        root: [
            '.', /* allows npm packages to be loaded */
            './notebook/static'
        ].map(x =>path.resolve(x)),
        modulesDirectories: [
            "components", /* bower */
            "node_modules" /* npm */
        ]
    },
    module: {
        loaders: [
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
    return _.extend({}, commonConfig, {
        entry: './notebook/static/' + appName + '/js/main.js',
        output: {
            filename: 'main.min.js',
            path: './notebook/static/' + appName + '/js/built',
            publicPath: "/static/" + appName + "/js/built/"
        },
        devtool: 'source-map'
    });
}

module.exports = [
    'auth',
    'edit',
    'terminal',
    'tree',
    'notebook',
    _.extend({}, commonConfig, {
        entry: './notebook/static/services/contents.js',
        output: {
            filename: 'contents.js',
            path: './notebook/static/services/built',
            libraryTarget: 'amd'
        },
    })
].map(x => buildConfig(x));
