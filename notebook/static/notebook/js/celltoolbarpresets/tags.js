// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'notebook/js/celltoolbar'
], function(celltoolbar) {
    "use strict";

    var CellToolbar = celltoolbar.CellToolbar;

    var remove_tag = function(cell) {
        return function(tag_name) {
            if (!cell.metadata || !cell.metadata.tags) {
                // No tags to remove
                return;
            }
            // Remove tag from tags list
            var index = cell.metadata.tags.indexOf(tag_name);
            if (index !== -1) {
                cell.metadata.tags.splice(index, 1);
            }
            // If tags list is empty, remove it
            if (cell.metadata.tags.length === 0) {
                delete cell.metadata.tags;
            }
        };
    };

    var make_tag_container = function(cell, on_remove) {

        var tag_container = $('<span/>').
            addClass('tag-container');
        var tag_list = cell.metadata.tags || [];
        if (!Array.isArray(tag_list)) {
            // We cannot make tags UI for this cell!
            // Maybe someone else used "tags" for something?
            return null;  // Fail gracefully
        }
        for (var i=0; i < tag_list.length; ++i) {
            var tag_name = tag_list[i];
            if (typeof tag_name !== 'string') {
                // Unexpected type, disable toolbar for safety
                return null;
            }
            var tag = make_tag(tag_name, on_remove);
            tag_container.append(tag);
        }
        return tag_container;
    };

    var make_tag = function(name, on_remove) {
        var tag_container = $('<span/>')
            .addClass('cell-tag')
            .text(name);

        var remove_button = $('<a/>')
            .addClass('remove-tag-btn')
            .text('X')
            .click( function(ev) {
                if (ev.button === 0) {
                    // Remove tag from container
                    tag_container.remove();
                    // Remove tag from cell
                    if (on_remove) {
                        on_remove(name);
                    }
                    return false;
                }
            });
        tag_container.append(remove_button);
        return tag_container;
    };

    // Single edit with button to add tags
    var add_tag_edit = function(div, cell, on_add) {
        var button_container = $(div);

        var text = $('<input/>').attr('type', 'text');
        var button = $('<button />')
            .addClass('btn btn-default btn-xs')
            .text('Add tag')
            .click(function() {
                on_add(text[0].value);
                // Clear input after adding:
                text[0].value = '';
                return false;
            });
        // Wire enter in input to button click
        text.keyup(function(event){
            if(event.keyCode == 13){
                button.click();
            }
        });
        button_container.append(
            $('<span/>')
                .append(text)
                .append(button)
                .addClass('tags-input')
            );
        IPython.keyboard_manager.register_events(text);
    };

    var add_tags_cellbar = function(div, cell) {
        var button_container = $(div);

        button_container.addClass('tags_button_container');

        var on_remove = remove_tag(cell);

        var tag_container = make_tag_container(cell, on_remove);
        if (tag_container === null) {
            return;
        }
        button_container.append(tag_container);

        add_tag_edit(div, cell, function(name) {
            // Add to metadata
            if (cell.metadata.tags === undefined) {
                cell.metadata.tags = [];
            } else if (cell.metadata.tags.indexOf(name) !== -1) {
                // Tag already exists
                return;
            }
            cell.metadata.tags.push(name);
            // Make tag visual
            var tag = make_tag(name, on_remove);
            tag_container.append(tag);
        });
    };

    var register = function(notebook) {
      CellToolbar.register_callback('tags.edit', add_tags_cellbar);

      var tags_preset = [];
      tags_preset.push('tags.edit');

      CellToolbar.register_preset('Tags', tags_preset, notebook);

    };
    return {'register' : register};
});
