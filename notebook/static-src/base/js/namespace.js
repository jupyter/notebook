// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

    "use strict";

    var Jupyter = window.Jupyter || {};
    var jprop = function(name, loaded, module_path, global) {
        if (!Jupyter.hasOwnProperty(name)) {
            Object.defineProperty(Jupyter, name, {
                get: function() {
                    console.warn('accessing `'+name+'` is deprecated. Use `require(\'' + module_path + '\')' + (global ? '[\'' + name + '\']' : '') + '`');
                    return global ? loaded[name] : loaded; 
                },
                enumerable: true,
                configurable: false
            });    
        }
    };

    var jprop_deferred = function(name, module_path, global) {
        if (!Jupyter.hasOwnProperty(name)) {
            Jupyter[name] = null;
            requirejs([module_path], function(loaded) {
                jprop(name, loaded, module_path, global);
            }, function(err) {
                console.warn('Jupyter.' + name + ' unavailable because "' + module_path + '" was not loaded.', err);
            });
        }
    };


    // expose modules

    jprop('utils', require('base/js/utils'), 'base/js/utils');

    //Jupyter.load_extensions = Jupyter.utils.load_extensions;
    // 
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

    Jupyter.version = "4.1.0.dev";
    Jupyter._target = '_blank';

    module.exports = Jupyter;
    window.Jupyter = Jupyter;
    
    // deprecated since 4.0, remove in 5+
    window.IPython = Jupyter;
