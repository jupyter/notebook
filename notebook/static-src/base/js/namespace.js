// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

"use strict";

if (!window.Jupyter) {
    window.Jupyter = {};
}

var jprop = function(name, loaded, module_path, global_mod) {
    if (!(window.Jupyter).hasOwnProperty(name)) {
        Object.defineProperty(window.Jupyter, name, {
            get: function() {
                console.warn('accessing `'+name+'` is deprecated. Use `require(\'' + module_path + '\')' + (global_mod ? '[\'' + name + '\']' : '') + '`');
                return global_mod ? loaded[name] : loaded; 
            },
            enumerable: true,
            configurable: false
        });    
    }
};

// expose modules
jprop('events', require('base/js/events'), 'base/js/events');
jprop('utils', require('base/js/utils'), 'base/js/utils');
jprop('security', require('base/js/security'), 'base/js/security');
jprop('keyboard', require('base/js/keyboard'), 'base/js/keyboard');
jprop('dialog', require('base/js/dialog'), 'base/js/dialog');
jprop('mathjaxutils', require('notebook/js/mathjaxutils'), 'notebook/js/mathjaxutils');

//// exposed constructors
jprop('CommManager', require('services/kernels/comm'), 'services/kernels/comm', true);
jprop('Comm', require('services/kernels/comm'), 'services/kernels/comm', true);

jprop('NotificationWidget', require('base/js/notificationwidget'), 'base/js/notificationwidget', true);
jprop('Kernel', require('services/kernels/kernel'), 'services/kernels/kernel', true);
jprop('Session', require('services/sessions/session'), 'services/sessions/session', true);
jprop('LoginWidget', require('auth/js/loginwidget'), 'auth/js/loginwidget', true);
jprop('Page', require('base/js/page'), 'base/js/page', true);

// notebook
jprop('TextCell', require('notebook/js/textcell'), 'notebook/js/textcell', true);
jprop('OutputArea', require('notebook/js/outputarea'), 'notebook/js/outputarea', true);
jprop('KeyboardManager', require('notebook/js/keyboardmanager'), 'notebook/js/keyboardmanager', true);
jprop('Completer', require('notebook/js/completer'), 'notebook/js/completer', true);
jprop('Notebook', require('notebook/js/notebook'), 'notebook/js/notebook', true);
jprop('Tooltip', require('notebook/js/tooltip'), 'notebook/js/tooltip', true);
jprop('ToolBar', require('notebook/js/toolbar'), 'notebook/js/toolbar', true);
jprop('SaveWidget', require('notebook/js/savewidget'), 'notebook/js/savewidget', true);
jprop('Pager', require('notebook/js/pager'), 'notebook/js/pager', true);
jprop('QuickHelp', require('notebook/js/quickhelp'), 'notebook/js/quickhelp', true);
jprop('MarkdownCell', require('notebook/js/textcell'), 'notebook/js/textcell', true);
jprop('RawCell', require('notebook/js/textcell'), 'notebook/js/textcell', true);
jprop('Cell', require('notebook/js/cell'), 'notebook/js/cell', true);
jprop('MainToolBar', require('notebook/js/maintoolbar'), 'notebook/js/maintoolbar', true);
jprop('NotebookNotificationArea', require('notebook/js/notificationarea'), 'notebook/js/notificationarea', true);
jprop('NotebookTour', require( 'notebook/js/tour'),  'notebook/js/tour', true);
jprop('MenuBar', require( 'notebook/js/menubar'),  'notebook/js/menubar', true);

// tree
jprop('SessionList', require('tree/js/sessionlist'), 'tree/js/sessionlist', true);

window.Jupyter.version = "4.1.0.dev";
window.Jupyter._target = '_blank';

// deprecated since 4.0, remove in 5+
window.IPython = window.Jupyter;
    
module.exports = window.Jupyter;
