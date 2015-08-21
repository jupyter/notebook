// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

"use strict";

/**
 * jquery, jquery-ui, and bootstrap all really on weird window level logic.
 * This module handles the global loading of those tools. 
 */
module.exports = new Promise(function(resolve, reject) {
    if (window.hasOwnProperty('jquery')) {
        resolve();
    }
    
    requirejs(['jquery'], function($) {
        var jQueryProperty = {
            get: function() {
                return $;
            },
            configurable: false
        };
        Object.defineProperty(window, '$', jQueryProperty);
        Object.defineProperty(window, 'jQuery', jQueryProperty);
        console.log('jQuery loaded and available in global namespace');
        
        requirejs(['jqueryui', 'bootstrap'], function() {
            if ($.prototype.modal) {
                console.log('bootstrap loaded and injected into jQuery\'s namespace');
            } else {
                reject(new Error('bootstrap not injected into jQuery prototype'));
            }
            
            if ($.prototype.draggable && $.prototype.resizable) {
                console.log('jQueryUI loaded and injected into jQuery\'s namespace');
            } else {
                reject(new Error('jQueryUI not injected into jQuery prototype'));
            }
            
            requirejs([
                'codemirror/lib/codemirror',
                'codemirror/mode/meta',
                'codemirror/addon/comment/comment',
                'codemirror/addon/dialog/dialog',
                'codemirror/addon/edit/closebrackets',
                'codemirror/addon/edit/matchbrackets',
                'codemirror/addon/search/searchcursor',
                'codemirror/addon/search/search',
                'codemirror/keymap/emacs',
                'codemirror/keymap/sublime',
                'codemirror/keymap/vim',
                'codemirror/mode/python/python',
                'codemirror/addon/runmode/runmode',
                'codemirror/mode/gfm/gfm',
                'notebook/js/codemirror-ipython',
                'notebook/js/codemirror-ipythongfm'
            ], function(CodeMirror) {
                var codeMirrorProperty = {
                    get: function() {
                        return CodeMirror;
                    },
                    configurable: false
                };
                Object.defineProperty(window, 'CodeMirror', codeMirrorProperty);
                console.log('CodeMirror loaded and available in global namespace');
                
                resolve();
            }, function(err) {
                console.error('could not load CodeMirror and/or it\'s plugins');
                reject(err);
            });
        }, function(err) {
            console.error('could not load jqueryui and/or bootstrap');
            reject(err);
        });
    }, function(err) {
        console.error('could not load jquery');
        reject(err);
    });
});