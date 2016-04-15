// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
'use strict';

// Load CSS.
require('font-awesome/css/font-awesome.min.css');
require('jupyter-js-plugins/lib/default-theme/index.css');

// ES6 Promise polyfill
require('es6-promise').polyfill();

var phosphide = require('phosphide/lib/core/application');

var app = new phosphide.Application({
  extensions: [
    require('phosphide/lib/extensions/commandpalette').commandPaletteExtension,
    require('jupyter-js-plugins/lib/terminal/plugin').terminalExtension,
    require('jupyter-js-plugins/lib/filehandler/plugin').fileHandlerExtension,
    require('jupyter-js-plugins/lib/filebrowser/plugin').fileBrowserExtension,
    require('jupyter-js-plugins/lib/imagehandler/plugin').imageHandlerExtension,
    require('jupyter-js-plugins/lib/help/plugin').helpHandlerExtension,
    require('jupyter-js-plugins/lib/notebook/plugin').notebookHandlerExtension,
    require('jupyter-js-plugins/lib/shortcuts/plugin').shortcutsExtension,
    require('jupyter-js-plugins/lib/about/plugin').aboutExtension
  ],
  providers: [
    require('jupyter-js-plugins/lib/documentmanager/plugin').documentManagerProvider,
    require('jupyter-js-plugins/lib/services/plugin').servicesProvider
  ]
});

window.onload = function() {
  app.run();
}
