// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// Module to handle i18n ( Internationalization ) and translated UI

define([
    'jed',
    'moment',
    'json!../../../i18n/nbjs.json',
    'json!../../../i18n/de/LC_MESSAGES/nbjs.json',
	], function(Jed, moment, nbjs, nbjs_de) {
    "use strict";
        
    // Setup language related stuff
    var ui_lang = navigator.languages && navigator.languages[0] || // Chrome / Firefox
    navigator.language ||   // All browsers
    navigator.userLanguage; // IE <= 10

    // If we do a real implementation with multiple languages, we will
    // have to figure out how to load the proper JSON dynamically,
    // probably writing a plugin to do it.
    // Since there's just one right now, it's not a big deal to load it
    // via define([]);

    var i18n = new Jed(nbjs);
    if (nbjs.supported_languages.indexOf(ui_lang) >= 0) {
		moment.locale(ui_lang);
		i18n = new Jed(nbjs_de);
    }
    
    i18n._ = i18n.gettext;
    
    return i18n;
});
