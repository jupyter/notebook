// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'notebook/js/celltoolbar',
], function(celltoolbar) {
    "use strict";

    var CellToolbar = celltoolbar.CellToolbar;

    var ds_post_cell = function(div, cell, celltoolbar) {
        // save a reference to the button container
        var buttonContainer = $(div);
        // this function will create the actual checkboxes
        function makeCheckbox(name) {
            // create the elements for the checkbox
            var chkb = $('<input/>').attr('type', 'checkbox')
                                    .css('margin-left', '5px')
            var labelElement = $('<label/>').append($('<span/>').text(name))
                                    .css('margin-left', '10px')
                                    .css('margin-right', 0)

            // add the checkbox to the label element
            labelElement.append(chkb)

            // the name of the piece of metadata managed by this checkbox
            var metaName = name.toLowerCase()

            // if there isn't a ds appropriate store
            if (!cell.metadata._datascience) {
                // add the ds namespace to the cell metadata
                cell.metadata._datascience = {}
            }
            // the object containing this cells metadata
            var cellMeta = cell.metadata._datascience
            // grab the current value for the appropriate piece of metadata
            var currentValue = cellMeta[metaName]  || false


            // make sure the checkbox matches the current value
            chkb.attr('checked', currentValue)

            // when the user clicks on the checkbox
            chkb.click(function() {
                // the new value for the state
                var newValue = !cellMeta[metaName]
                // write the new value to the cell metadata
                cellMeta[metaName] = newValue
            })

            // return the element we created
            return labelElement
        }

        // create a single element with both checkboxes
        var spanForBoxes = $('<span/>')
                                .append(makeCheckbox('Summary'))
                                .append(makeCheckbox('Keep'))

        // add the boxes to the button
        buttonContainer.append(spanForBoxes)
    }

    var register = function (notebook) {
        CellToolbar.register_callback('ds_post_cell.chkb', ds_post_cell)
        CellToolbar.register_preset('DS Post API', ['ds_post_cell.chkb'], notebook);
        CellToolbar.activate_preset("DS Post API");
        CellToolbar.global_show();
    };
    return {'register': register};
});
