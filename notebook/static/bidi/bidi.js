// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'bidi/numericshaping',
], function (numericshaping){
    "use strict";
    var shaperType="";
    var textDir="";
    
   /* var _getCalendarType = function (){
    	return calendarType;
    };*/
    
    var _setUserPreferences = function (shapertype) {
    	shaperType = shapertype;
    	textDir = "rtl";
    };

    var _uiLang= function (){
    	return navigator.language.toLowerCase();
    };
    
    var _loadLocale = function () {
    	try{
    		if(_isMirroringEnabled()){
    			$("body").attr("dir","rtl");
    		}
    		requirejs(['components/moment/locale/'+_uiLang()], function (){});
    	}catch (err) {
    		return moment.locale();
    		console.log("Error loading the required locale");
            console.warn(err);
    	}
    };
    
    var _isMirroringEnabled= function() {
    	return (new RegExp("^(ar|he)").test(_uiLang()));
    };
    
    var _applyNumericShaping = function (value) {
    	value = numericshaping.shapeNumerals(value, shaperType, textDir);
        return value;
    };
    
    var bidi = {
    	setUserPreferences : _setUserPreferences,
    	applyNumericShaping : _applyNumericShaping,
    	isMirroringEnabled : _isMirroringEnabled,
    	loadLocale : _loadLocale,
    };
    
    return bidi;
});
