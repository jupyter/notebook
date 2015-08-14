if (process.argv.length >= 4) {
    var fs = require('fs');
    var aliasify = require('aliasify');
    var browserify = require('browserify');

    var aliasifyConfig = {
        aliases: {
            // underscore : 'components/underscore/underscore-min',
            // backbone : 'components/backbone/backbone-min',
            // jquery: 'components/jquery/jquery.min',
            bootstrap: 'components/bootstrap/js/bootstrap.min',
            bootstraptour: 'components/bootstrap-tour/build/js/bootstrap-tour.min',
            // jqueryui: 'components/jquery-ui/ui/minified/jquery-ui.min',
            // moment: 'components/moment/moment',
            // codemirror: 'components/codemirror',
            // termjs: 'components/term.js/src/term'
            
            jqueryui: 'jquery-ui',
            termjs: 'term.js'
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
    b.add(__dirname + '/static/' + process.argv[2]);
    b.bundle().pipe(fs.createWriteStream(__dirname + '/static/' + process.argv[3]));
} else {
    
    var amdWrap = require("amd-wrap-legacy");
    var glob = require("glob");
    var path = require('path');
    var fs = require('fs');
    
    var source = "./notebook/static-src";
    var destination = "./notebook/static";
    
    glob(path.join(source, "**/*.js"), function(err, files) {
        if (err) {
            console.error('Could not glob files.', err);
        } else {
            files.forEach(function(file, index) {
                var toFile = path.join(destination, path.relative(source, file));
                fs.readFile(file, 'utf8', function (err, data) {
                    if (err) {
                        console.error('Could not read file ' + file, err);
                    } else {
                        fs.writeFile(toFile, amdWrap(data), function(err) {
                            if(err) {
                                return console.error('Could not write file ' + toFile, err);
                            }
                        }); 
                    }
                });
            });
        }
    });
    // var wrapped = amdWrap("module.exports = 5;");
}
