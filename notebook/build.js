var fs = require('fs');
var aliasify = require('aliasify');
var browserify = require('browserify');

var aliasifyConfig = {
    aliases: {
        underscore : 'components/underscore/underscore-min',
        backbone : 'components/backbone/backbone-min',
        jquery: 'components/jquery/jquery.min',
        bootstrap: 'components/bootstrap/js/bootstrap.min',
        bootstraptour: 'components/bootstrap-tour/build/js/bootstrap-tour.min',
        jqueryui: 'components/jquery-ui/ui/minified/jquery-ui.min',
        moment: 'components/moment/moment',
        codemirror: 'components/codemirror',
        termjs: 'components/term.js/src/term'
    },
    verbose: false
}

var b = browserify({
    paths: [
        __dirname + '/static',
    ],
    debug: true,
    fullPaths: true
});

b.transform(aliasify, aliasifyConfig);
b.exclude('contents');
b.add(__dirname + '/static/' + process.argv[2]);
b.bundle().pipe(fs.createWriteStream(__dirname + '/static/' + process.argv[3]));
