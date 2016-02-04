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
    }
};

var commonOutputConfig = {
    filename: 'main.min.js',
    libraryTarget: 'amd'
};

function buildConfig(appName) {
    return _.extend({}, commonConfig, {
        entry: './notebook/static/' + appName + '/js/main.js',
        output: _.extend({}, commonOutputConfig, {
            path: './notebook/static/' + appName + '/js/built',
        }),
    });
}

module.exports = [
    'auth',
    'edit',
    'notebook',
    'terminal',
    'tree'
].map(x => buildConfig(x));
