// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define(function(require){
    "use strict";

    var $ = require("jquery");
    var dialog = require("base/js/dialog");
    var CommandPalette = function(notebook) {
        var form = $('<form/>').css('background', 'white');
        var container = $('<div/>').addClass('typeahead-container');
        var field = $('<div/>').addClass('typeahead-field');
        var span = $('<span>').addClass('typeahead-query');
        var input = $('<input/>').attr('type', 'search').css('outline', 'none');
        span.append(input);
        field
            .append(span)
            .append(
                $('<span/>').addClass('typeahead-button').append(
                    $('<button/>').attr('type', 'submit').append(
                        $('<span/>').addClass('typeahead-search-icon')
                        )
                )
            );

        container.append(field);
        form.append(container);
        
        var mod = $('<div/>').addClass('modal').append(
          $('<div/>').addClass('modal-dialog')
          .css('box-shadow', '2px 4px 16px 7px rgba(0, 0, 0, 0.34);')
          .css('border-radius', '5px;')
          .append(
            $('<div/>').addClass('modal-content').append(
              $('<div/>').addClass('modal-body')
              .css('padding', '7px')
              .append(
                form
              )
            )
          )
        )
        .modal({show: false, backdrop:true})
        .on('shown.bs.modal', function () {
              input.focus();
        })
        .on("hidden.bs.modal", function () {
            if (notebook) {
                var cell = notebook.get_selected_cell();
                if (cell) cell.select();
            }
            if (notebook.keyboard_manager) {
                notebook.keyboard_manager.enable();
                notebook.keyboard_manager.command_mode();
            }
        });
        
        notebook.keyboard_manager.disable();


        var onSubmit = function (node, query, result, resultCount) {
                    console.log(node, query, result, resultCount);
                    if (actions.indexOf(result.key) >= 0) {
                        IPython.notebook.keyboard_manager.actions.call(result.key);
                    } else {
                        console.log("No command " + result.key)
                    }
                    mod.modal('hide');
                }

        var src = {};

        var actions = Object.keys(IPython.notebook.keyboard_manager.actions._actions);
        var hum = function(str){
          return str.split('.')[1].replace(/-/g,' ').replace(/_/g,'-')
        }
        
        var mode = function(name){
          var sht = IPython.keyboard_manager.command_shortcuts.get_shortcut_for_action_name(name)
          if(sht){
            return 'command-sht'
          }
          var sht = IPython.keyboard_manager.edit_shortcuts.get_shortcut_for_action_name(name)
          if(sht){
            return 'edit-sht'
          }
          return 'no-sht'
        }
        
        
        
        for( var i=0; i< actions.length; i++){
          var group = actions[i].split('.')[0];
          if(group === 'ipython'){
            group = 'built-in';
          }
          src[group] = src[group] || {data:[], display:'display'};
          src[group].data.push({ display: hum(actions[i]),
                    shortcut:IPython.keyboard_manager.command_shortcuts.get_shortcut_for_action_name(actions[i])
                    || IPython.keyboard_manager.edit_shortcuts.get_shortcut_for_action_name(actions[i]),
                    key:actions[i],
                    modesht: mode(actions[i]),
                    group:group,
                   })
        }
        input.typeahead({
            emptyTemplate: "No results found for {{query}}",
            maxItem: 15,
            minLength: 0,
            hint: true,
            group: ["group", "{{group}} extension"],
            searchOnFocus: true,
            mustSelectItem: true,
            template: '{{display}}  <div class="pull-right {{modesht}}"><kbd>{{shortcut}}</kbd></div>',
            order: "asc",
            source: src,
            callback: {
                onInit: function () {console.log('this is init') },
                onSubmit: onSubmit ,
                onClickAfter: onSubmit
            }
        })

        mod.modal('show')
    }
    return {'CommandPalette': CommandPalette};
});
