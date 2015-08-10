// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define(function(require){
    "use strict";

    var $ = require("jquery");
    var dialog = require("base/js/dialog");
    var CommandPalette = function(notebook) {
        var form = $('<form/>');
        var container = $('<div/>').addClass('typeahead-container');
        var field = $('<div/>').addClass('typeahead-field');
        var span = $('<span>').addClass('typeahead-query');
        var input = $('<input/>').attr('type', 'search');
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
        var mod = dialog.modal({
            title: 'Execute Action',
            body: $('<div/>').append(form),
            keyboard_manager: notebook.keyboard_manager,
            show: false
        }).on('shown.bs.modal', function () {
              input.focus();
        });

        var onSubmit = function (node, query, result, resultCount) {
                    console.log(node, query, result, resultCount);
                    if (actions.indexOf(result.key) >= 0) {
                        IPython.notebook.keyboard_manager.actions.call(result.key);
                    } else {
                        console.log("No command " + result.key)
                    }
                    mod.modal('hide');
                }

        var src = [];

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
          src.push({ display: hum(actions[i]),
                    shortcut:IPython.keyboard_manager.command_shortcuts.get_shortcut_for_action_name(actions[i])
                    || IPython.keyboard_manager.edit_shortcuts.get_shortcut_for_action_name(actions[i])||'== no-sht== ',
                    key:actions[i],
                    group: actions[i].split('.')[0],
                    modesht: mode(actions[i])
                   })
        }
        input.typeahead({
            minLength: 0,
            hint: true,
            searchOnFocus: true,
            mustSelectItem: true,
            template: '{{display}}  <kbd class="pull-right {{modesht}}">{{shortcut}}</kbd>',
            order: "asc",
            source: {
                data: src
            },
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
