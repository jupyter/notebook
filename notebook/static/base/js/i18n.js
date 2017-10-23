// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// Module to handle i18n ( Internationalization ) and translated UI

define([
    'jed',
    'moment',
    'json!../../../i18n/nbjs.json',
	], function(Jed, moment, nbjs) {
    "use strict";
        
    // Setup language related stuff
    var ui_lang = navigator.languages && navigator.languages[0] || // Chrome / Firefox
    navigator.language ||   // All browsers
    navigator.userLanguage; // IE <= 10

    var i18n = new Jed(document.nbjs_translations);
    i18n._ = i18n.gettext;
    i18n.msg = i18n; // Just a place holder until the init promise resolves.

    return i18n;
});
