define(function(require){
  "use strict";
  
  var dialog = require('base/js/dialog');
  function escapeRegExp(string){
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  var compute_preview_model = function(sre, arr, isCaseSensitive, RegExpOrNot, replace){
    var html = [];
    // and create an array of
    // before_match, match , replacement, after_match
    var aborted = false;
    var replacer_reg = new RegExpOrNot(sre);
    for(var r=0; r < arr.length; r++){
      var current_line = arr[r];
      var match_abort = getMatches(sre, current_line, isCaseSensitive, RegExpOrNot);
      aborted = aborted || match_abort[1];
      var matches = match_abort[0];
      for(var mindex=0; mindex < matches.length ; mindex++){
        var start = matches[mindex][0];
        var stop = matches[mindex][1];
        var initial = current_line.slice(start, stop);
        var replaced = initial.replace(replacer_reg, replace);
        // that might be better as a dict
        html.push([cutBefore(current_line.slice(0, start)),
                   initial,
                   replaced,
                   cutAfter(current_line.slice(stop), 30-(stop-start))]);
      }
    }
    return [html, aborted];
  };
  // build the previewe
  var build_preview = function(body, aborted, html, replace){
    body.empty();
    if(aborted){
      body.append($('<p/>').addClass('bg-warning').text("Warning, too many matches ("+html.length+"+), some changes might not be shown or applied"));
    } else {
      body.append($('<p/>').addClass('bg-info').text(html.length+" matche"+(html.length==1?'':'s')));

    }
    for(var rindex=0; rindex<html.length; rindex++){
      var pre = $('<pre/>').addClass('replace-preview')
        .append(html[rindex][0])
        .append($('<span/>').addClass('match').text(html[rindex][1]));
      if(replace){
        pre.append($('<span/>').addClass('replace').text(html[rindex][2]));
        pre.addClass('replace');
      }
      pre.append(html[rindex][3]);
      body.append(pre);
    }
  };
  
  var cutAfter = function(string, n){
    n=n||10;
    while(n<10){
      n+=15;
    }
    if(string.length > n+3){
        return string.slice(0, n)+'...';
    }
    return string;
  };

  var cutBefore = function(string){
    if(string.length > 33){
        return '...'+string.slice(-30);
    }
    return string;
  };

  var getMatches = function(re, string, caseSensitive, r){
    var extra = caseSensitive ? '':'i';
    extra = '';
    try {
      re = r(re, 'g'+extra);// have to global or infinite loop
    } catch (e){
      return [[], false];
    }
    var res = [];
    var match;
    // yes this is a castin !=
    var escape_hatch = 0;
    var abort = false;
    while((match = re.exec(string)) !== null) {
        res.push([match.index, match.index+match[0].length]);
        escape_hatch++;
        if(escape_hatch > 100){
          console.warn("More than  100 matches, aborting");
          abort = true;
          break;
        }
    }
    return [res, abort];
  };
  
  // main function
  var snr = function(env){
    var search  = $("<input/>")
      .addClass('form-control')
      .css('width','86%')
      .attr('placeholder','Search');
    var isRegExpButton = $('<button/>')
      .attr('type', 'button')
      .attr('id', 'isreg')
      .addClass("btn btn-default")
      .attr('data-toggle','button')
      .attr('title', 'use regular expression (now you have N+1 problems)')
      .attr('value', '.*')
      .css('border-radius', '0')
      .css('border-left', 'none')
      .text('.*');

    var isCaseSensitiveButton = $('<button/>')
      .attr('type', 'button')
      .addClass("btn btn-default")
      .attr('data-toggle','button')
      .attr('title', 'is search case sensitive')
      .attr('value', 'a≠A')
      .css('border-top-left-radius', '0')
      .css('border-bottom-left-radius', '0')
      .css('border-left', 'none')
      .text('a≠A');

    var repl = $("<input/>")
      .addClass('form-control')
      .attr('placeholder','replace');
    var body = $('<div/>')
      .css('max-height','60vh')
      .css('overflow','auto');
    var form = $('<form/>')
      .append($('<div/>').addClass('form-group')
        .append(
          $('<div/>').addClass('input-group').css("width","100%")
          .append(search)
          .append(isRegExpButton)
          .append(isCaseSensitiveButton)
        )
      )
      .append($('<div/>').addClass('form-group').append(repl))
      .append(body);


    // return wether the search is case sensitive
    var isCaseSensitive = function(){
      var value =  isCaseSensitiveButton.attr('aria-pressed') == 'true';
      return value;
    };

    // return wether the search is reex based, or
    // plain string maching.
    var isReg = function(){
      var value =  isRegExpButton.attr('aria-pressed') == 'true';
      return value;
    };


    // returna Pseudo RexEx object that acts
    // either as a plain RegExp Object, or as a pure string matching.
    // automatically set the flags for case sensitivity from the UI
    var RegExpOrNot = function(str, flags){
      if (!isCaseSensitive()){
        flags = (flags || '')+'i';
      }
      if (isRegExpButton.attr('aria-pressed') === 'true'){
        return new RegExp(str, flags);
      } else {
        return new RegExp(escapeRegExp(str), flags);
      }
    };


    var onError = function(body){
      body.empty();
      body.append($('<p/>').text('No matches, invalid or empty regular expression'));
    };

    var get_all_text = function(cells) {
      if (get_all_text._cache) {
        return get_all_text._cache;
      }
      var arr = [];
      for (var c = 0; c < cells.length; c++) {
        arr = arr.concat(cells[c].code_mirror.getValue().split('\n'));
      }
      get_all_text._cache = arr;
      return arr;
    };
    /**
     * callback trigered anytime a change is made to the
     * request, caseSensitivity, isregex, search or replace
     * modification.
     **/
    var onChange = function(){

      var sre = search.val();
      // abort on invalid RE
      if (!sre) {
        return onError(body);
      }
      try {
        new RegExpOrNot(sre);
      } catch (e) {
        return onError(body);
      }

      // might want to warn if replace is empty
      var replace = repl.val();
      var lines = get_all_text(env.notebook.get_cells());
      
      var _hb = compute_preview_model(sre, lines, isCaseSensitive(), RegExpOrNot, replace);
      var html = _hb[0];
      var aborted = _hb[1];

      build_preview(body, aborted, html, replace);
      
      // done on type return false not to submit form
      return false;
    };

    var onsubmit = function(event) {
      var sre = search.val();
      var replace = repl.val();
      if (!sre) {
        return false;
      }
      // should abort on invalid regexp.

      var cells = env.notebook.get_cells();
      // need to be multiline if we want to directly replace in codemirror.
      // or need to split/replace/join
      var reg = RegExpOrNot(sre, 'gm');
      for (var c = 0; c < cells.length; c++) {
        var cell = cells[c];
        var oldvalue = cell.code_mirror.getValue();
        var newvalue = oldvalue.replace(reg , replace);
        cell.code_mirror.setValue(newvalue);
        if (cell.cell_type === 'markdown') {
          cell.rendered = false;
          cell.render();
        }
      }
    };

    // wire-up the UI

    isRegExpButton.click(function(){
      search.focus();
      setTimeout(function(){onChange();}, 100);
    });

    isCaseSensitiveButton.click(function(){
      search.focus();
      setTimeout(function(){onChange();}, 100);
    });

    search.keypress(function (e) {
      if (e.which == 13) {//enter
        repl.focus();
      }
    });

    search.on('input', onChange);
    repl.on('input',  onChange);


    var mod = dialog.modal({
      show: false,
      title: "Search and Replace",
      body:form,
      keyboard_manager: env.notebook.keyboard_manager,
      buttons:{
        'Replace All':{ class: "btn-primary",
            click: function(event){onsubmit(event); return true;}
        }
      },
      open: function(){
        search.focus();
      }
    });

    repl.keypress(function (e) {
      if (e.which == 13) {//enter
        onsubmit();
        mod.modal('hide');
      }
    });
    mod.modal('show');
  };
  
  
  var load = function(keyboard_manager){
    var action = {
        help: 'search and replace',
        handler: snr
    };
    
    keyboard_manager.actions.register(snr, 'search-and-replace-dialog', 'ipython');
    
  };
  
  
  return {load:load};
});
