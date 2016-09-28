var path = require('path');
var fs = require('fs');


/**
 * Make a shim file for a built notebook bundle that re-exports
 * each module to an AMD module.
 *
 * @param name (string) - The name of the output bundle.
 */
function makeShim(name) {
    var manifest = require('../notebook/static/' + name + '/js/built/vendor-manifest.json');
    var content = [];
    for (var key in manifest.content) {
        var num = String(manifest.content[key]);
        if (path.extname(key) !== '.js') {
            continue;
        }
        key = key.replace('./notebook/static/', '');
        key = key.replace('./node_modules/', '');
        key = key.replace('.js', '');
        var line = 'define("' + key + '", function () { return ';
        line += manifest.name + '(' + num + '); });'
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
