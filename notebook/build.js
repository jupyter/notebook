var fs = require('fs');
var aliasify = require('aliasify');
var browserify = require('browserify');
var mkdirp = require("mkdirp");
var path = require('path');

var aliasifyConfig = {
    aliases: {
        jqueryui: 'jquery-ui',
        termjs: 'term.js'
    },
    verbose: false
}

var b = browserify({
    paths: [
        __dirname + '/static-src',
    ],
    debug: true,
    fullPaths: true
});

b.transform(aliasify, aliasifyConfig);
var mkdirp = require("mkdirp");
b.add(__dirname + '/static-src/' + process.argv[2]);
var toFile = __dirname + '/static/' + process.argv[3];
mkdirp(path.dirname(toFile), function(err) { 
    if (err) {
        console.error('Could not mkdirp ', err);
    } else {
        b.bundle().pipe(fs.createWriteStream(toFile));
    }
});
