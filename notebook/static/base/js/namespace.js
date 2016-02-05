// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.


var Jupyter = Jupyter || {};

var jprop = function(name, loadedModule, modulePath){
    Object.defineProperty(Jupyter, name, {
      get: function() { 
          console.warn('accessing `'+name+'` is deprecated. Use `require("'+modulePath+'")`');
          return loadedModule; 
      },
      enumerable: true,
      configurable: false
    });
};

var jglobal = function(name, loadedModule, modulePath){
    Object.defineProperty(Jupyter, name, {
      get: function() { 
          console.warn('accessing `'+name+'` is deprecated. Use `require("'+modulePath+'").'+name+'`');
          return loadedModule[name]; 
      },
      enumerable: true,
      configurable: false
    });
};

define(function(){
    "use strict";

    // expose modules

    jprop('utils',require('base/js/utils'), 'base/js/utils');

    //Jupyter.load_extensions = Jupyter.utils.load_extensions;
    //
    jprop('security',require('base/js/security'), 'base/js/security');
    jprop('keyboard',require('base/js/keyboard'), 'base/js/keyboard');
    jprop('dialog',require('base/js/dialog'), 'base/js/dialog');
    jprop('mathjaxutils',require('notebook/js/mathjaxutils'), 'notebook/js/mathjaxutils');


    //// exposed constructors
    jglobal('CommManager',require('services/kernels/comm'), 'services/kernels/comm');
    jglobal('Comm',require('services/kernels/comm'), 'services/kernels/comm');

    jglobal('NotificationWidget',require('base/js/notificationwidget'), 'base/js/notificationwidget');
    jglobal('Kernel',require('services/kernels/kernel'), 'services/kernels/kernel');
    jglobal('Session',require('services/sessions/session'), 'services/sessions/session');
    jglobal('LoginWidget',require('auth/js/loginwidget'), 'auth/js/loginwidget');
    jglobal('Page',require('base/js/page'), 'base/js/page');

    // notebook
    jglobal('TextCell',require('notebook/js/textcell'), 'notebook/js/textcell');
    jglobal('OutputArea',require('notebook/js/outputarea'), 'notebook/js/outputarea');
    jglobal('KeyboardManager',require('notebook/js/keyboardmanager'), 'notebook/js/keyboardmanager');
    jglobal('Completer',require('notebook/js/completer'), 'notebook/js/completer');
    jglobal('Notebook',require('notebook/js/notebook'), 'notebook/js/notebook');
    jglobal('Tooltip',require('notebook/js/tooltip'), 'notebook/js/tooltip');
    jglobal('Toolbar',require('notebook/js/toolbar'), 'notebook/js/toolbar');
    jglobal('SaveWidget',require('notebook/js/savewidget'), 'notebook/js/savewidget');
    jglobal('Pager',require('notebook/js/pager'), 'notebook/js/pager');
    jglobal('QuickHelp',require('notebook/js/quickhelp'), 'notebook/js/quickhelp');
    jglobal('MarkdownCell',require('notebook/js/textcell'), 'notebook/js/textcell');
    jglobal('RawCell',require('notebook/js/textcell'), 'notebook/js/textcell');
    jglobal('Cell',require('notebook/js/cell'), 'notebook/js/cell');
    jglobal('MainToolBar',require('notebook/js/maintoolbar'), 'notebook/js/maintoolbar');
    jglobal('NotebookNotificationArea',require('notebook/js/notificationarea'), 'notebook/js/notificationarea');
    jglobal('NotebookTour',require('notebook/js/tour'), 'notebook/js/tour');
    jglobal('MenuBar',require('notebook/js/menubar'), 'notebook/js/menubar');

    // tree
    jglobal('SessionList',require('tree/js/sessionlist'), 'tree/js/sessionlist');

    Jupyter.version = "5.0.0.dev";
    Jupyter._target = '_blank';
    return Jupyter;
});

// deprecated since 4.0, remove in 5+
var IPython = Jupyter;
