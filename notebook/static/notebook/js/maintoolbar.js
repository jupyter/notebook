// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'require',
    'jquery',
    './toolbar',
    './celltoolbar'
], function(require, $, toolbar, celltoolbar) {
    "use strict";

    var MainToolBar = function (selector, options) {
        /**
         * Constructor
         *
         * Parameters:
         *  selector: string
         *  options: dictionary
         *      Dictionary of keyword arguments.
         *          events: $(Events) instance
         *          notebook: Notebook instance
         **/
        toolbar.ToolBar.apply(this, [selector, options] );
        this.events = options.events;
        this.notebook = options.notebook;
        this._make();
        Object.seal(this);
    };

    MainToolBar.prototype = Object.create(toolbar.ToolBar.prototype);

    MainToolBar.prototype._make = function () {
        var grps = [
          [
            ['jupyter-notebook:save-notebook'],
            'save-notbook'
          ],
          [
            ['jupyter-notebook:insert-cell-below'],
            'insert_above_below'],
          [
            ['jupyter-notebook:cut-cell',
             'jupyter-notebook:copy-cell',
             'jupyter-notebook:paste-cell-below'
            ] ,
            'cut_copy_paste'],
          [
            ['jupyter-notebook:move-cell-up',
             'jupyter-notebook:move-cell-down'
            ],
            'move_up_down'],
          [ ['jupyter-notebook:run-cell-and-select-next',
             'jupyter-notebook:interrupt-kernel',
             'jupyter-notebook:confirm-restart-kernel'
            ],
            'run_int'],
         ['<add_celltype_list>'],
         [['jupyter-notebook:show-command-palette']],
         ['<add_celltoolbar_reminder>']
        ];
        this.construct(grps);
    };
   
    MainToolBar.prototype._pseudo_actions = {};


    // reminder of where the celltoolbar new menu is, remove for 5.0
    MainToolBar.prototype._pseudo_actions.add_celltoolbar_reminder = function () {
        var _b = $('<button/>').attr('title','show new celltoolbar selector location').addClass('btn btn-default').text('CellToolbar')
        var btn = $('<div/>').addClass('btn-group').append(_b)

        _b.on('click', function(){
            setTimeout(function(){$('#view_menu').parent().addClass('pulse')},0) 
            setTimeout(function(){$('#view_menu').parent().addClass('open')},1000) 
            setTimeout(function(){$('#menu-cell-toolbar').children('a').addClass('pulse')},2000)
            setTimeout(function(){$('#menu-cell-toolbar').children('ul').css('display','block')},3000)
            setTimeout(function(){$('#menu-cell-toolbar').children('ul').css('display','')},5400)
            setTimeout(function(){$('#menu-cell-toolbar').children('a').removeClass('pulse')},5600)
            setTimeout(function(){$('#view_menu').parent().removeClass('open')},5800)
            setTimeout(function(){$('#view_menu').parent().removeClass('pulse')},6000)
        })

        return btn;
    };

    
    // add a cell type drop down to the maintoolbar.
    // triggered when the pseudo action `<add_celltype_list>` is
    // encountered when building a toolbar.
    MainToolBar.prototype._pseudo_actions.add_celltype_list = function () {
        var that = this;
        var multiselect = $('<option/>').attr('value','multiselect').attr('disabled','').text('-');
        var sel = $('<select/>')
            .attr('id','cell_type')
            .addClass('form-control select-xs')
            .append($('<option/>').attr('value','code').text('Code'))
            .append($('<option/>').attr('value','markdown').text('Markdown'))
            .append($('<option/>').attr('value','raw').text('Raw NBConvert'))
            .append($('<option/>').attr('value','heading').text('Heading'))
            .append(multiselect);
        this.notebook.keyboard_manager.register_events(sel);
        this.events.on('selected_cell_type_changed.Notebook', function (event, data) {
            if ( that.notebook.get_selected_cells_indices().length > 1) {
                multiselect.show();
                sel.val('multiselect');
            } else {
                multiselect.hide()
                if (data.cell_type === 'heading') {
                    sel.val('Markdown');
                } else {
                    sel.val(data.cell_type);
                }
            }
        });
        sel.change(function () {
            var cell_type = $(this).val();
            switch (cell_type) {
            case 'code':
                that.notebook.cells_to_code();
                break;
            case 'markdown':
                that.notebook.cells_to_markdown();
                break;
            case 'raw':
                that.notebook.cells_to_raw();
                break;
            case 'heading':
                that.notebook._warn_heading();
                that.notebook.to_heading();
                sel.val('markdown');
                break;
            case 'multiselect':
                break;
            default:
                console.log("unrecognized cell type:", cell_type);
            }
            that.notebook.focus_cell();
        });
        return sel;

    };

    return {'MainToolBar': MainToolBar};
});
