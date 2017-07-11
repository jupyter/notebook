/**
 * Plugin to load a single locale.
 */
define([
	"require",
	"module",
	 // These are only here so that the optimizer knows which ones we MIGHT load.
	 // We will actually only load the ones we need. There should be one entry
	 // here for each language you want to support.
	 // For example, for German....
	 // "json!base/../../i18n/de/LC_MESSAGES/nbjs.json"
    ], function (require, module) {
	return {
		id: module.id,

		load: function (locale, callerRequire, onload, loaderConfig) {

			var dependencies = "json!base/../../i18n/"+locale+"/LC_MESSAGES/nbjs.json";

			// Load the JSON file requested
			require([dependencies], function (data) {
				onload(data);
			});
		}
	};
});
