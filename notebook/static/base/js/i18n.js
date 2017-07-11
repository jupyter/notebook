// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// Module to handle i18n ( Internationalization ) and translated UI

define([
    'jed',
    'moment',
    'json!../../../i18n/nbjs.json',
    'base/js/i18nload',
	], function(Jed, moment, nbjs, i18nload) {
    "use strict";
        
    // Setup language related stuff
    var ui_lang = navigator.languages && navigator.languages[0] || // Chrome / Firefox
    navigator.language ||   // All browsers
    navigator.userLanguage; // IE <= 10

    var init = function() {
    	var msg_promise;
    	if (nbjs.supported_languages.indexOf(ui_lang) >= 0) {
    		moment.locale(ui_lang);
    		msg_promise = new Promise( function (resolve, reject) {
    			require([i18nload.id+"!"+ui_lang], function (data) {
    				var newi18n = new Jed(data);
    				newi18n._ = newi18n.gettext;
    				resolve(newi18n);
    			}, function (error) {
    	            console.log("Error loading translations for language: "+ui_lang);
    	            var newi18n = new Jed(nbjs);
    	            newi18n._ = newi18n.gettext;
    	            resolve(newi18n);
    			});
    	   });
    	} else {
    		msg_promise = new Promise( function (resolve, reject) {
			    var newi18n = new Jed(nbjs);
				newi18n._ = newi18n.gettext;
				resolve(newi18n);
    		});
    	}
    	return msg_promise;
    }
    var i18n = new Jed(nbjs);   
    i18n._ = i18n.gettext;
    i18n.msg = i18n; // Just a place holder until the init promise resolves.
    
    init().then(function (msg) {
    	i18n.msg = msg;
    	i18n.msg._ = i18n.msg.gettext;
    });
    
    return i18n;
});
