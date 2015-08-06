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
        span.append(input)
        field.append(span)
        container.append(field)
        form.append(container)
        input.typeahead({
            order: "asc",
            source: {
                groupName: {
                    data: [ 'california', 'washington', 'state', 'france', 'china', 'russia', 'rust', 'river' , 'repression']
                }
            },
            callback: {
                onInit: function () {console.log('this is init') }
            }
        })
        dialog.modal({
            title: 'Execute Action',
            body: $('<div/>').append(form),
            buttons: {
                OK: {'class': 'btn-primary'}
            },
            keyboard_manager: notebook.keyboard_manager
        });
    }
    return {'CommandPalette': CommandPalette};
});

