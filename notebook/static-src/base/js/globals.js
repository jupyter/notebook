// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

"use strict";

/**
 * jquery, jquery-ui, and bootstrap all really on weird window level logic.
 * This module handles the global loading of those tools. 
 */
module.exports = new Promise(function(resolve, reject) {
    requirejs(['jquery'], function($) {
        window.$ = window.jQuery = $;
        console.log('jQuery loaded and available in global namespace');
        
        requirejs(['jqueryui', 'bootstrap'], function() {
            if ($.prototype.modal) {
                console.log('bootstrap loaded and injected into jQuery\'s namespace');
            } else {
                reject(new Error('bootstrap not injected into jQuery prototype'));
            }
            
            if ($.prototype.draggable) {
                console.log('jQueryUI loaded and injected into jQuery\'s namespace');
            } else {
                reject(new Error('jQueryUI not injected into jQuery prototype'));
            }
            
            resolve();
        }, function(err) {
            console.error('could not load jqueryui and/or bootstrap');
            reject(err);
        });
    }, function(err) {
        console.error('could not load jquery');
        reject(err);
    });
});