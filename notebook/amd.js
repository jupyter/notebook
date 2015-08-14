var amdWrap = require("amd-wrap-legacy");
var glob = require("glob");
var path = require('path');
var fs = require('fs');
var mkdirp = require("mkdirp");

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
                    mkdirp(path.dirname(toFile), function(err) { if (err) {console.error('Could not mkdirp ', err);} });
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