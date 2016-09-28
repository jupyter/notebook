var path = require('path');
var fs = require('fs');


function makeShim(name) {
    var manifest = require('../notebook/static/' + name + '/js/built/vendor-manifest.json');
    var content = [];
    for (var key in manifest.content) {
        var num = manifest.content[key];
        if (path.extname(key) !== '.js') {
            continue;
        }
        key = key.replace('./notebook/static/', '');
        key = key.replace('./node_modules/', '');
        key = key.replace('.js', '');
        var line = 'define("' + key + '", function () { return vendor(';
        line += String(num) + '); });'
        content.push(line);
    }
    var outputPath = './notebook/static/' + name + '/js/built/shim.bundle.js';
    fs.writeFileSync(outputPath, content.join('\n'));
}


[
    'auth',
    'edit',
    'terminal',
    'tree',
    'notebook'
    ].forEach(function (name) {
        makeShim(name);
    })
