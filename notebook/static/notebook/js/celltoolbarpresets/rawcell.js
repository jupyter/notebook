// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'notebook/js/celltoolbar',
    'base/js/dialog',
    'base/js/keyboard',
    'base/js/utils'
], function(celltoolbar, dialog, keyboard, utils) {
    "use strict";

  var _ = function(text) {
  	return utils.i18n.gettext(text);
  }    

  var CellToolbar = celltoolbar.CellToolbar;
  var raw_cell_preset = [];

  var select_type = CellToolbar.utils.select_ui_generator([
    [_("None"), "-"],
    [_("LaTeX"), "text/latex"],
    [_("reST"), "text/restructuredtext"],
    [_("HTML"), "text/html"],
    [_("Markdown"), "text/markdown"],
    [_("Python"), "text/x-python"],
    [_("Custom"), "dialog"],

    ],
      // setter
      function(cell, value) {
        if (value === "-") {
          delete cell.metadata.raw_mimetype;
        } else if (value === 'dialog'){
            var dialog = $('<div/>').append(
                $("<p/>")
                    .text(_("Set the MIME type of the raw cell:"))
            ).append(
                $("<br/>")
            ).append(
                $('<input/>').attr('type','text').attr('size','25')
                .val(cell.metadata.raw_mimetype || "-")
            );
            dialog.modal({
                title: _("Raw Cell MIME Type"),
                body: dialog,
                buttons : {
                    "Cancel": {},
                    "OK": {
                        class: "btn-primary",
                        click: function () {
                            console.log(cell);
                            cell.metadata.raw_mimetype = $(this).find('input').val();
                            console.log(cell.metadata);
                        }
                    }
                },
                open : function (event, ui) {
                    var that = $(this);
                    // Upon ENTER, click the OK button.
                    that.find('input[type="text"]').keydown(function (event, ui) {
                        if (event.which === keyboard.keycodes.enter) {
                            that.find('.btn-primary').first().click();
                            return false;
                        }
                    });
                    that.find('input[type="text"]').focus().select();
                }
            });
        } else {
          cell.metadata.raw_mimetype = value;
        }
      },
      //getter
      function(cell) {
        return cell.metadata.raw_mimetype || "";
      },
      // name
      _("Raw NBConvert Format")
  );

  var register = function (notebook) {
    CellToolbar.register_callback('raw_cell.select', select_type, ['raw']);
    raw_cell_preset.push('raw_cell.select');

    CellToolbar.register_preset(_('Raw Cell Format'), raw_cell_preset, notebook);
  };
  return {'register': register};

});
