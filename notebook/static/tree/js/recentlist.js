// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define(["base/js/namespace"], function(IPython) {
  "use strict";

  var RecentList = function() {
    //mru
    function RecentList() {
      console.log("manope");
      // document.getElementById("recent_list").innerHTML = "manope";
      // fetch("./recentlist.json")
      //   .then(function(resp) {
      //     return resp.json();
      //   })
      //   .then(function(data) {
      //     if (data.length == 0)
      //       document.getElementById("recent_list_placeholder").style.display =
      //         "block";
      //     data.forEach(function(x) {
      //       var time = x.Time;
      //       var path = x.Path;
      //       var name = x.Name;
      //       addNewFile(name, path, time);
      //     });
      //   });
      // function addNewFile(name, path, time) {
      //   var y = document.getElementById("recent_list").innerHTML;
      //   document.getElementById("recent_list").innerHTML =
      //     y +
      //     '<div class="list_item row"><div class="col-md-12"><i class="item_icon notebook_icon icon-fixed-width"></i><a class="item_link" href="notebooks/' +
      //     path +
      //     '" target="_blank"><span class="item_name">' +
      //     name +
      //     '</span></a> <div class="pull-right"><div class="item_buttons pull-right"><button class="btn btn-warning btn-xs" id="remove-nb">Remove</button></div><div class="pull-left"><span class="item_modified pull-left" title="' +
      //     time +
      //     '">' +
      //     time +
      //     '</span><span class="file_size pull-right">&nbsp;</span></div></div></div></div>';
    }
  };

  // Backwards compatibility.
  IPython.RecentList = RecentList; //mru

  return { RecentList: RecentList }; //mru
});
