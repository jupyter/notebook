// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'bidi/numericshaping',
    'moment-hijri',
], function (numericshaping, moment){
    "use strict";
    var calendarType="";
    var textDir="";
    var shaperType="";
    
    var _setCalendarType = function (val){
        calendarType=val;
    };
    
    var _getcalendarType = function (){
    	return calendarType;
    };
    
    var _setTextDir = function (dir){
    	textDir=dir;
    };
    
    var _setNumericShaping = function (val){
    	shaperType=val;
    };
    
    var _flags= {
    		NS: 1,
    		CALENDAR : 2
    };
    
    /*
     * Test the UI Language
     */
    var _uiLang= function (){
    	return navigator.language.toLowerCase();
    };
   /*
    * TODO: this function cannot be invoked once ,as moment has different formats for the date .
    * It needs improvements.
    */
    var _getGlobalizedDate = function (date) {
        var lang = _uiLang();
        if (calendarType === "hijri" || lang ==='ar-sa') {
        	
        } else if (calendarType === "hebrew") {
        }
        return;
    };
    
    /*
     * check if the locale exists provided by moment 
     */
    var _hasLocale = function (lang) {
    	if (lang == 'af'||'ar-ma'||'ar-sa'||'ar'||'az'||'be'||'bg' ||'bn'||'bo'||'br'||'bs'||'ca'||'cs'||'cv'||'cy'||'da'||'de-at'||'de'||'el'||'en-au'||'en-ca'||'en-gb'||'eo'||'es'||'et'||'eu'||'fa'||'fi'||'fo'||'fr-ca'||'fr'||'gl'||'he'||'hi'||'hr'||'hu'||'hy-am'||'id'||'is'||'it'||'ja'||'ka'||'km'||'ko'||'lb'||'lt'||'lv'||'mk'||'ml'||'mr'||'ms-my'||'my'||'nb'||'ne'||'nl'||'nn'||'pl'||'pt-br'||'pt'||'ro'||'ru'||'sk'||'sl'||'sq'||'sr-cyrl'||'sr'||'sv'||'ta'||'th'||'tl-ph'||'tr'||'tzm-latn'||'tzm'||'uk'||'uz'||'vi'||'zh-cn'||'zh-tw' ) {
    		return true;
    	}
    	else{
    		return false;
    	}
    };
    
    /*
     * to load the required locale
     */
    var _loadLocale = function (lang) {
    	if ( _hasLocale(lang)){
    		return requirejs(['components/moment/locale/'+lang], function (){});
    	}
    	else{
    		return requirejs(['components/moment'], function (){});
    	}
    };
    
    /*
     *  TODO: to add the other RTL languages
     */
    var _isMirroringEnabled= function() {
    	if(new RegExp("^(ar|he)").test(_uiLang())){
    		$("body").attr("dir","rtl");
    	}
    	return;
    };
    
    var _applyBidi = function (value , flag) {
        if(flag & _flags.NS == _flags.NS) {
    		value = numericshaping.shapeNumerals(value, shaperType, textDir);
    		return value;
        }
        if(flag & _flags.CALENDAR == _flags.CALENDAR) {
    		value = _getGlobalizedDate(value);
    		console.log("Calendar ");
    		return value;
    	}
        return value;
    };
    
    var bidi = { 
    	isMirroringEnabled : _isMirroringEnabled,
    	setNumericShaping : _setNumericShaping,
    	setCalendarType: _setCalendarType,
    	getcalendarType : _getcalendarType,
    	setTextDir : _setTextDir,
    	getGlobalizedDate: _getGlobalizedDate,
    	flags : _flags,
    	applyBidi : _applyBidi,
    	uiLang : _uiLang,
    	loadLocale : _loadLocale,
    };
    
    return bidi;
});
