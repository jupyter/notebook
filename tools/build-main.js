// build main.min.js
// spawned by gulp to allow parallelism

var rjs = require('requirejs').optimize;

var name = process.argv[2];

var rjs_config = {
  name: name + '/js/main',
  out: './notebook/static/' + name + '/js/main.min.js',
  baseUrl: 'notebook/static',
  preserveLicenseComments: false, // license comments conflict with sourcemap generation
  generateSourceMaps: true,
  optimize: "none",
  paths: {
    underscore : 'components/underscore/underscore-min',
    backbone : 'components/backbone/backbone-min',
    jquery: 'components/jquery/jquery.min',
    bootstrap: 'components/bootstrap/js/bootstrap.min',
    bootstraptour: 'components/bootstrap-tour/build/js/bootstrap-tour.min',
    "jquery-ui": 'components/jquery-ui/ui/minified/jquery-ui.min',
    moment: 'components/moment/moment',
    codemirror: 'components/codemirror',
    termjs: 'components/xterm.js/dist/xterm',
    typeahead: 'components/jquery-typeahead/dist/jquery.typeahead',
    contents: 'empty:',
    custom: 'empty:',
  },
  map: { // for backward compatibility
    "*": {
        "jqueryui": "jquery-ui",
    }
  },
  shim: {
    typeahead: {
            deps: ["jquery"],
            exports: "typeahead"
          },
    underscore: {
      exports: '_'
    },
    backbone: {
      deps: ["underscore", "jquery"],
      exports: "Backbone"
    },
    bootstrap: {
      deps: ["jquery"],
      exports: "bootstrap"
    },
    bootstraptour: {
      deps: ["bootstrap"],
      exports: "Tour"
    },
    "jquery-ui": {
      deps: ["jquery"],
      exports: "$"
    }
  },

  exclude: [
    "custom/custom",
  ]
};

rjs(rjs_config, console.log, function (err) {
  console.log("Failed to build", name, err);
  process.exit(1);
});
