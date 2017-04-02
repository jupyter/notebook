// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'bidi/numericshaping',
], function (numericshaping){
    "use strict";
    var shaperType="";
    var textDir="";
    
    var _setUserPreferences = function (shapertype /*, textdir*/) {  //for future work in case of BTD Support we need to set the textDir also.  
    	shaperType = shapertype;
    	if (_uiLang() == 'ar'||'he'){
    		textDir = "rtl";
    	}else {
    	    textDir = "ltr";
    	}
    };

    var _uiLang= function (){
    	return navigator.language.toLowerCase();
    };

	var _loadLocale = function () {
		if(_isMirroringEnabled()){
			$("body").attr("dir","rtl");
		}
		requirejs(['components/moment/locale/'+_uiLang()], function (err){
			console.warn("Error loading the required locale");
			console.warn(err);
	    });
    };
    
    var _isMirroringEnabled= function() {
    	return (new RegExp("^(ar|he)").test(_uiLang()));
    };

    /**
     * NS :  for digit Shaping.
     * BTD : for future work in case of Base Text Direction Addition.
     */  
    /*var _flags= {
        NS: 1,
    	BTD : 2
    };*/
    
    /**
     * @param value : the string to apply the bidi-support on it.
     * @param flag :indicates the type of bidi-support (Numeric-shaping ,Base-text-dir ).
     */
    var _applyBidi = function (value /*, flag*/) {
    	value = numericshaping.shapeNumerals(value, shaperType, textDir);
        return value;
    };
    
    var bidi = {
    	setUserPreferences : _setUserPreferences,
    	applyBidi : _applyBidi,
    	isMirroringEnabled : _isMirroringEnabled,
    	loadLocale : _loadLocale,
    };
    
    return bidi;
});
