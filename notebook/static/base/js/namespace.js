// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.


var Jupyter;
if (typeof window !== 'undefined') {
  Jupyter = window['Jupyter'] = window['Jupyter'] || {};
} else {
  Jupyter = Jupyter || {};
}

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

    if (!Jupyter.hasOwnProperty('utils')) jprop('utils',require('base/js/utils'), 'base/js/utils');

    if (!Jupyter.hasOwnProperty('security')) jprop('security',require('base/js/security'), 'base/js/security');
    if (!Jupyter.hasOwnProperty('keyboard')) jprop('keyboard',require('base/js/keyboard'), 'base/js/keyboard');
    if (!Jupyter.hasOwnProperty('dialog')) jprop('dialog',require('base/js/dialog'), 'base/js/dialog');
    if (!Jupyter.hasOwnProperty('mathjaxutils')) jprop('mathjaxutils',require('notebook/js/mathjaxutils'), 'notebook/js/mathjaxutils');


    //// exposed constructors
    if (!Jupyter.hasOwnProperty('CommManager')) jglobal('CommManager',require('services/kernels/comm'), 'services/kernels/comm');
    if (!Jupyter.hasOwnProperty('Comm')) jglobal('Comm',require('services/kernels/comm'), 'services/kernels/comm');

    if (!Jupyter.hasOwnProperty('NotificationWidget')) jglobal('NotificationWidget',require('base/js/notificationwidget'), 'base/js/notificationwidget');
    if (!Jupyter.hasOwnProperty('Kernel')) jglobal('Kernel',require('services/kernels/kernel'), 'services/kernels/kernel');
    if (!Jupyter.hasOwnProperty('Session')) jglobal('Session',require('services/sessions/session'), 'services/sessions/session');
    if (!Jupyter.hasOwnProperty('LoginWidget')) jglobal('LoginWidget',require('auth/js/loginwidget'), 'auth/js/loginwidget');
    if (!Jupyter.hasOwnProperty('Page')) jglobal('Page',require('base/js/page'), 'base/js/page');

    // notebook
    if (!Jupyter.hasOwnProperty('TextCell')) jglobal('TextCell',require('notebook/js/textcell'), 'notebook/js/textcell');
    if (!Jupyter.hasOwnProperty('OutputArea')) jglobal('OutputArea',require('notebook/js/outputarea'), 'notebook/js/outputarea');
    if (!Jupyter.hasOwnProperty('KeyboardManager')) jglobal('KeyboardManager',require('notebook/js/keyboardmanager'), 'notebook/js/keyboardmanager');
    if (!Jupyter.hasOwnProperty('Completer')) jglobal('Completer',require('notebook/js/completer'), 'notebook/js/completer');
    if (!Jupyter.hasOwnProperty('Notebook')) jglobal('Notebook',require('notebook/js/notebook'), 'notebook/js/notebook');
    if (!Jupyter.hasOwnProperty('Tooltip')) jglobal('Tooltip',require('notebook/js/tooltip'), 'notebook/js/tooltip');
    if (!Jupyter.hasOwnProperty('Toolbar')) jglobal('Toolbar',require('notebook/js/toolbar'), 'notebook/js/toolbar');
    if (!Jupyter.hasOwnProperty('SaveWidget')) jglobal('SaveWidget',require('notebook/js/savewidget'), 'notebook/js/savewidget');
    if (!Jupyter.hasOwnProperty('Pager')) jglobal('Pager',require('notebook/js/pager'), 'notebook/js/pager');
    if (!Jupyter.hasOwnProperty('QuickHelp')) jglobal('QuickHelp',require('notebook/js/quickhelp'), 'notebook/js/quickhelp');
    if (!Jupyter.hasOwnProperty('MarkdownCell')) jglobal('MarkdownCell',require('notebook/js/textcell'), 'notebook/js/textcell');
    if (!Jupyter.hasOwnProperty('RawCell')) jglobal('RawCell',require('notebook/js/textcell'), 'notebook/js/textcell');
    if (!Jupyter.hasOwnProperty('Cell')) jglobal('Cell',require('notebook/js/cell'), 'notebook/js/cell');
    if (!Jupyter.hasOwnProperty('MainToolBar')) jglobal('MainToolBar',require('notebook/js/maintoolbar'), 'notebook/js/maintoolbar');
    if (!Jupyter.hasOwnProperty('NotebookNotificationArea')) jglobal('NotebookNotificationArea',require('notebook/js/notificationarea'), 'notebook/js/notificationarea');
    if (!Jupyter.hasOwnProperty('NotebookTour')) jglobal('NotebookTour',require('notebook/js/tour'), 'notebook/js/tour');
    if (!Jupyter.hasOwnProperty('MenuBar')) jglobal('MenuBar',require('notebook/js/menubar'), 'notebook/js/menubar');

    // tree
    if (!Jupyter.hasOwnProperty('SessionList')) jglobal('SessionList',require('tree/js/sessionlist'), 'tree/js/sessionlist');

    Jupyter.version = "5.0.0.dev";
    Jupyter._target = '_blank';
    return Jupyter;
});

// deprecated since 4.0, remove in 5+
window['IPython'] = Jupyter;
