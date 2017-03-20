// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define(['base/js/utils',
        'moment',
        'moment-hijri',
        ],
    function(utils, moment, moment_hijri ,bidi) {
    "use strict";
    
    var calendarType = "";

    var setType = function (val) {
    	calendarType = val;
    };
    
    var formatDate = function (date){
        var chkd = moment(date);
        var long_date = chkd.format('llll');
        var human_date;
        var tdelta = Math.ceil(new Date() - date);
        if (tdelta < utils.time.milliseconds.d){
            // less than 24 hours old, use relative date
            human_date = chkd.fromNow();
        } else {
            // otherwise show calendar 
            // <Today | yesterday|...> at hh,mm,ss
            human_date = chkd.calendar();
        }
        return {
        	long_date : long_date,
        	human_date : human_date
        };

    }
    
    return{
    	formatDate : formatDate,
    	setType : setType
    };
    
});
