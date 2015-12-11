define(function(require){
  "use strict";

  var dialog = require('base/js/dialog');

  /**
   * escape a Regular expression to act as  a pure search string.
   * though it will still have the case sensitivity options and all
   * the benefits
   **/
  function escapeRegExp(string){
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Compute the model of the preview for the search and replace.
   * It might not be perfectly accurate if matches overlap...
   * Parameter:
   *   sre: the string that will become the Search Regular Expression
   *   arr: a list of string on which the match will be applied.
   *   isCaseSensitive: should the match be CaseSensitive
   *   RegExOrNot: a `RegExOrNot` object.
   *   replace: the replacement string for the matching `sre`
   * Return: a tuple of 2 value:
   *   1) array of [before match, match, replacement, after match]
   *      where before and after match are cut to a reasonable length after the match.
   *   2) Boolean, whether the matching has been aborted because one of the element of
   *      arr have too many matches.
   **/
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
        // that might be better as a dictionary
        html.push([cutBefore(current_line.slice(0, start)),
                   initial,
                   replaced,
                   cutAfter(current_line.slice(stop), 30-(stop-start))]);
      }
    }
    return [html, aborted];
  };

  /**
   * Build the preview model where things matched and their replacement values
   * are wrapped in tags with correct CSS classes.
   * Parameter:
   *   body: jQuery element into which the preview will be build
   *   aborted : have the model been aborted (Boolean) use to tell the user
   *      that the preview might not show all the replacements
   *   html: array of model created by compute_preview_model
   *   replace: Boolean: whether we are actually replacing with something or just matching.
   **/
  var build_preview = function(body, aborted, html, replace){
    body.empty();
    if(aborted){
      body.append($('<p/>').addClass('bg-warning').text("Warning, too many matches ("+html.length+"+), some changes might not be shown or applied"));
    } else {
      body.append($('<p/>').text(html.length+" match"+(html.length==1?'':'es')));
    }
    for(var rindex=0; rindex<html.length; rindex++){
      var pre = $('<pre/>')
        .append(html[rindex][0])
        .append($('<span/>').addClass('match').text(html[rindex][1]));
      if(replace){
        pre.append($('<span/>').addClass('insert').text(html[rindex][2]));
        pre.addClass('replace');
      }
      pre.append(html[rindex][3]);
      body.append(pre);
    }
  };

  /**
   * Given a string, return only the beginning, with potentially an ellipsis
   * at the end.
   **/
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

  /**
   * Given a string, return only the end, with potentially an ellipsis
   * at the beginning.
   **/
  var cutBefore = function(string){
    if(string.length > 33){
        return '...'+string.slice(-30);
    }
    return string;
  };

  /**
   * Find all occurrences of `re` in `string`, match in a `caseSensitive`
   * manner or not, and determine whether `re` is a RegExp or not depending of
   * the type of object passed as `r`.
   *
   * Return a tuple
   *  1) list of matches [start, stop] indexes in the string.
   *  2) abort Boolean, if more that 100 matches and the matches were aborted.
   **/
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
    var escape_hatch = 0;
    var abort = false;
    while((match = re.exec(string)) !== null) {
        res.push([match.index, match.index+match[0].length]);
        escape_hatch++;
        if(escape_hatch > 100){
          console.warn("More than 100 matches, aborting");
          abort = true;
          break;
        }
    }
    return [res, abort];
  };

  // main function
  /**
   * Search N' Replace action handler.
   **/
  var snr = function(env, event) {
      
    var isRegExpButton = $('<button/>')
      .attr('type', 'button')
      .attr('id', 'isreg')
      .addClass("btn btn-default btn-sm")
      .attr('data-toggle','button')
      .css('font-weight', 'bold')
      .attr('title', 'Use regex (JavaScript regex syntax)')
      .text('.*');

      var onlySelectedButton = $('<button/>')
      .append($('<i/>').addClass('fa fa-align-left'))
      .attr('type', 'button')
      .addClass("btn btn-default btn-sm")
      .attr('data-toggle','button')
      .attr('title', 'Replace in selected cells');

    var isCaseSensitiveButton = $('<button/>')
      .attr('type', 'button')
      .addClass("btn btn-default btn-sm")
      .attr('data-toggle','button')
      .attr('tabindex', '0')
      .attr('title', 'Match case')
      .css('font-weight', 'bold')
      .text('Aa');
     
    var search  = $("<input/>")
      .addClass('form-control input-sm')
      .attr('placeholder','Find');

    var findFormGroup = $('<div/>').addClass('form-group');
    findFormGroup.append(
        $('<div/>').addClass('input-group')
        .append(
            $('<div/>').addClass('input-group-btn')
                .append(isCaseSensitiveButton)
                .append(isRegExpButton)
                .append(onlySelectedButton)
        )
        .append(search)
    )

    var replace = $("<input/>")
      .addClass('form-control input-sm')
      .attr('placeholder','Replace');
    var replaceFormGroup = $('<div/>').addClass('form-group');
    replaceFormGroup.append(replace);

    var body = $('<div/>').attr('id', 'replace-preview');
     
    var form = $('<form/>').attr('id', 'find-and-replace')
    form.append(findFormGroup);
    form.append(replaceFormGroup);
    form.append(body);

    // return whether the search is case sensitive
    var isCaseSensitive = function(){
      var value =  isCaseSensitiveButton.attr('aria-pressed') == 'true';
      return value;
    };

    // return whether the search is RegExp based, or
    // plain string matching.
    var isReg = function(){
      var value =  isRegExpButton.attr('aria-pressed') == 'true';
      return value;
    };

    var onlySelected = function(){
      return (onlySelectedButton.attr('aria-pressed') == 'true');
    };


    // return a Pseudo RegExp object that acts
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

    var get_cells = function(env){
      if(onlySelected()){
        return env.notebook.get_selected_cells();
      } else {
        return env.notebook.get_cells();
      }
    };

    var get_all_text = function(cells) {
      var arr = [];
      for (var c = 0; c < cells.length; c++) {
        arr = arr.concat(cells[c].code_mirror.getValue().split('\n'));
      }
      return arr;
    };
    /**
     * callback triggered anytime a change is made to the
     * request, case sensitivity, isregex, search or replace
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
      var replaceValue = replace.val();
      var lines = get_all_text(get_cells(env));

      var _hb = compute_preview_model(sre, lines, isCaseSensitive(), RegExpOrNot, replaceValue);
      var html = _hb[0];
      var aborted = _hb[1];

      build_preview(body, aborted, html, replaceValue);

      // done on type return false not to submit form
      return false;
    };

    var onsubmit = function(event) {
      var sre = search.val();
      var replaceValue = replace.val();
      if (!sre) {
        return false;
      }
      // should abort on invalid RegExp.

      // need to be multi line if we want to directly replace in codemirror.
      // or need to split/replace/join
      var reg = RegExpOrNot(sre, 'gm');
      var cells = get_cells(env);
      for (var c = 0; c < cells.length; c++) {
        var cell = cells[c];
        var oldvalue = cell.code_mirror.getValue();
        var newvalue = oldvalue.replace(reg , replaceValue);
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

    onlySelectedButton.click(function(){
      replace.focus();
      setTimeout(function(){onChange();}, 100);
    });


    search.keypress(function (e) {
      if (e.which == 13) {//enter
        replace.focus();
      }
    });

    search.on('input', onChange);
    replace.on('input',  onChange);


    var mod = dialog.modal({
      show: false,
      title: "Find and Replace",
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

    replace.keypress(function (e) {
      if (e.which == 13) {//enter
        onsubmit();
        mod.modal('hide');
      }
    });
    mod.modal('show');
  };


  var load = function(keyboard_manager){
    var action_all = {
        help: 'find and replace',
        handler: function(env, event){
          snr(env, event);
        }
    };

    var act_all = keyboard_manager.actions.register(action_all, 'find-and-replace', 'jupyter-notebook');

    keyboard_manager.command_shortcuts.add_shortcuts({
        'f': 'jupyter-notebook:find-and-replace'
    });
  };


  return {load:load};
});
