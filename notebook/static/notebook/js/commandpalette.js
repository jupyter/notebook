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
        var actions = Object.keys(IPython.notebook.keyboard_manager.actions._actions);
        input.typeahead({
            order: "asc",
            source: {
                groupName: {
                    data:  actions
                }
            },
            callback: {
                onInit: function () {console.log('this is init') },
                onSubmit: function (node, query, result, resultCount) {
                    console.log(node, query, result, resultCount);
                    console.info(input.val(), 'has been selected');
                    if (actions.indexOf(input.val()) >= 0) {
                        IPython.notebook.keyboard_manager.actions.call(input.val());
                    }
                    else {
                        console.log("No command " + input.val());
                    }
                    mod.modal('hide');
                }
            }
        })

        mod.modal('show')
    }
    return {'CommandPalette': CommandPalette};
});

