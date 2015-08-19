var fs = require('fs');
var aliasify = require('aliasify');
var browserify = require('browserify');

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
b.transform('debowerify');
b.add(__dirname + '/static-src/' + process.argv[2]);
b.bundle().pipe(fs.createWriteStream(__dirname + '/static/' + process.argv[3]));
