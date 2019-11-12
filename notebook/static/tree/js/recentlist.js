// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'jquery',
    'base/js/utils',
    'bidi/bidi',
], function($, utils, bidi) {
    "use strict";

    var isRTL = bidi.isMirroringEnabled();
    var RecentList = function () {
        
    };
    
   RecentList.prototype.load_files=  function (){
        var that = this;
        var settings = {
            processData : false,
            cache : false,
            type : "GET",
            dataType : "json",
            success : $.proxy(that.addFiles, this),
            error : utils.log_ajax_error,
        };
        var url = utils.url_path_join('/', 'api/recentlist');
        utils.ajax(url, settings);
    };

RecentList.prototype.addFiles=function (data){

          document.getElementById("recent_list").innerHTML = "";
          if (data['Error']) {
                document.getElementById("recent_list").innerHTML = '<div class = "row list_placeholder">There are no recent notebooks.</div>';          

          }       
          else 
          {
                var count = 0;
                data.forEach(function(x) {
                var time = utils.format_datetime(x.Time);
                var path = x.Path;
                var y = document.getElementById("recent_list").innerHTML;
                document.getElementById("recent_list").innerHTML =
                  y +
                  '<div class="list_item row"><div class="col-md-12"><i class="item_icon notebook_icon icon-fixed-width"></i><a class="item_link" href="/notebooks/' +
                  path +
                  '" target="_blank"><span class="item_name">' +
                  path +
                  '</span></a> <div class="pull-right"><div class="item_buttons pull-right"><button onclick="deleteRecentList('+ String(count) +')" class="btn btn-warning btn-xs" id="remove-nb">Remove</button></div><div class="pull-left"><span class="item_modified pull-left" title="' +
                  time +
                  '">' +
                  time +
                  '</span><span class="file_size pull-right">&nbsp;</span></div></div></div></div>';
                count = count +1;
          });
        }
        
    };

    return {'RecentList': RecentList};
});
