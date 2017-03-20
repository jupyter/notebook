// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'bidi/numericshaping',
    'bidi/nationalcalendar',
], function (numericshaping ,nationalcalendar){
    "use strict";
    var shaperType="";
    var textDir="";
    
   /* var _getCalendarType = function (){
    	return calendarType;
    };*/
    
    var _setUserPreferences = function (calendartype, shapertype) {
    	nationalcalendar.setType(calendartype);
    	shaperType = shapertype;
    	textDir = "rtl";
    };
    
    var _flags= {
    	NS: 1,
    	CALENDAR : 2
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
    		console.log("Error loading the required locale");
            console.warn(err);
    	}
    };
    
    var _isMirroringEnabled= function() {
    	return (new RegExp("^(ar|he)").test(_uiLang()));
    };
    
    var _applyBidi = function (value , flag) {
        if(flag & _flags.NS == _flags.NS) {
    		value = numericshaping.shapeNumerals(value, shaperType, textDir);
    		//return value;
        }
        else if(flag & _flags.CALENDAR == _flags.CALENDAR) {
        	value = nationalcalendar.formatDate(value);
        	console.log(value.long_date  + " "+ value.human_date);
        }
        return value;
    };
    
    var bidi = {
    	setUserPreferences : _setUserPreferences,
    	flags : _flags,
    	applyBidi : _applyBidi,
    	isMirroringEnabled : _isMirroringEnabled,
    	loadLocale : _loadLocale,
    };
    
    return bidi;
});
