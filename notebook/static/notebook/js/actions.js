// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// How to pick action names:
//
// * First pick a noun and a verb for the action. For example, if the action is "restart kernel," the verb is
//   "restart" and the noun is "kernel".
// * Omit terms like "selected" and "active" by default, so "delete-cell", rather than "delete-selected-cell".
//   Only provide a scope like "-all-" if it is other than the default "selected" or "active" scope.
// * If an action has a secondary action, separate the secondary action with "-and-", so
//   "restart-kernel-and-clear-output".
// * Don't ever use before/after as they have a temporal connotation that is confusing when used in a spatial
//   context.
// * Use above/below or previous/next to indicate spacial and sequential relationships.
// * For dialogs, use a verb that indicates what the dialog will accomplish, such as "confirm-restart-kernel".


define([
    'base/js/utils',
    ], function(utils){
    "use strict";

    var i18n = utils.i18n;
    var _ = function(text) {
    	return i18n.gettext(text);
    }    

    var warn_bad_name = function(name){
        if(name !== "" && !name.match(/:/)){
            console.warn('You are trying to use an action/command name, where the separator between prefix and name is not `:`\n'+
                         '"'+name+'"\n'+
                         'You are likely to not use the API in a correct way. Typically use the following:\n'+
                         '`var key = actions.register(<object>, "<name>", "<prefix>");` and reuse the `key` variable'+
                         'instead of re-generating the key yourself.'
                    );
        }
    };

    var ActionHandler = function (env) {
        this.env = env || {};
        Object.seal(this);
    };

    var $ = require('jquery');
    var events =  require('base/js/events');

    /**
     *  A bunch of predefined `Simple Actions` used by Jupyter.
     *  `Simple Actions` have the following keys:
     *  help (optional): a short string the describe the action.
     *      will be used in various context, like as menu name, tool tips on buttons,
     *      and short description in help menu.
     *  help_index (optional): a string used to sort action in help menu.
     *  icon (optional): a short string that represent the icon that have to be used with this
     *  action. this should mainly correspond to a Font_awesome class.
     *  handler : a function which is called when the action is activated. It will receive at first parameter
     *      a dictionary containing various handle to element of the notebook.
     *
     *  action need to be registered with a **name** that can be use to refer to this action.
     *
     *  if `help` is not provided it will be derived by replacing any dash by space
     *  in the **name** of the action. It is advised to provide a prefix to action name to
     *  avoid conflict the prefix should be all lowercase and end with a dot `.`
     *  in the absence of a prefix the behavior of the action is undefined.
     *
     *  All action provided by the Jupyter notebook are prefixed with `jupyter-notebook:`.
     *
     *  One can register extra actions or replace an existing action with another one is possible
     *  but is considered undefined behavior.
     *
     **/
    var _actions = {
        'toggle-rtl-layout': {
        	cmd: _('toggle rtl layout'),
            help: _('Toggle the screen directionality between left-to-right and right-to-left'),
            handler: function () {
              (document.body.getAttribute('dir')=='rtl') ? document.body.setAttribute('dir','ltr') : document.body.setAttribute('dir','rtl');
            }
        },
        'edit-command-mode-keyboard-shortcuts': {
        	cmd: _('edit command mode keyboard shortcuts'),
            help: _('Open a dialog to edit the command mode keyboard shortcuts'),
            handler: function (env) {
                env.notebook.show_shortcuts_editor();
            }
        },
        'shutdown-kernel': {
            help: 'Shutdown the kernel (no confirmation dialog)',
            handler: function (env) {
                env.notebook.shutdown_kernel({confirm: false});
            }
        },
        'confirm-shutdown-kernel':{
            icon: 'fa-repeat',
            help_index : 'hb',
            help: 'Shutdown the kernel (with confirmation dialog)',
            handler : function (env) {
                env.notebook.shutdown_kernel();
            }
        },
        'restart-kernel': {
        	cmd: _('restart kernel'),
        	help: _('restart the kernel (no confirmation dialog)'),
            handler: function (env) {
                env.notebook.restart_kernel({confirm: false});
            },
        },
        'confirm-restart-kernel':{
            icon: 'fa-repeat',
            help_index : 'hb',
        	cmd: _('confirm restart kernel'),
            help: _('restart the kernel (with dialog)'),
            handler : function (env) {
                env.notebook.restart_kernel();
            }
        },
        'restart-kernel-and-run-all-cells': {
        	cmd: _('restart kernel and run all cells'),
            help: _('restart the kernel, then re-run the whole notebook (no confirmation dialog)'),
            handler: function (env) {
                env.notebook.restart_run_all({confirm: false});
            }
        },
        'confirm-restart-kernel-and-run-all-cells': {
        	cmd: _('confirm restart kernel and run all cells'),
            help: _('restart the kernel, then re-run the whole notebook (with dialog)'),
            handler: function (env) {
                env.notebook.restart_run_all();
            }
        },
        'restart-kernel-and-clear-output': {
        	cmd: _('restart kernel and clear output'),
            help: _('restart the kernel and clear all output (no confirmation dialog)'),
            handler: function (env) {
                env.notebook.restart_clear_output({confirm: false});
            }
        },
        'confirm-restart-kernel-and-clear-output': {
        	cmd: _('confirm restart kernel and clear output'),
            help: _('restart the kernel and clear all output (with dialog)'),
            handler: function (env) {
                env.notebook.restart_clear_output();
            }
        },
        'interrupt-kernel':{
            icon: 'fa-stop',
            cmd: _('interrupt the kernel'),
            help: _('interrupt the kernel'),
            help_index : 'ha',
            handler : function (env) {
                env.notebook.kernel.interrupt();
            }
        },
        'run-cell-and-select-next': {
            cmd: _('run cell and select next'),
            icon: 'fa-step-forward',
            help: _('run cell, select below'),
            help_index : 'ba',
            handler : function (env) {
                env.notebook.execute_cell_and_select_below();
            }
        },
        'run-cell':{
            cmd: _('run selected cells'),
            help    : _('run selected cells'),
            help_index : 'bb',
            handler : function (env) {
                env.notebook.execute_selected_cells();
            }
        },
        'run-cell-and-insert-below':{
            cmd: _('run cell and insert below'),
            help    : _('run cell and insert below'),
            help_index : 'bc',
            handler : function (env) {
                env.notebook.execute_cell_and_insert_below();
            }
        },
        'run-all-cells': {
            cmd: _('run all cells'),
            help: _('run all cells'),
            help_index: 'bd',
            handler: function (env) {
                env.notebook.execute_all_cells();
            }
        },
        'run-all-cells-above':{
            cmd: _('run all cells above'),
            help: _('run all cells above'),
            handler : function (env) {
                env.notebook.execute_cells_above();
            }
        },
        'run-all-cells-below':{
            cmd: _('run all cells below'),
            help: _('run all cells below'),
            handler : function (env) {
                env.notebook.execute_cells_below();
            }
        },
        'enter-command-mode': {
            cmd: _('enter command mode'),
            help    : _('enter command mode'),
            help_index : 'aa',
            handler : function (env) {
                env.notebook.command_mode();
            }
        },
        'insert-image': {
            cmd: _('insert image'),
            help      : _('insert image'),
            help_index : 'dz',
            handler : function (env) {
                env.notebook.insert_image();
            }
        },
        'cut-cell-attachments': {
            cmd: _('cut cell attachments'),
            help    : _('cut cell attachments'),
            help_index : 'dza',
            handler: function (env) {
                env.notebook.cut_cell_attachments();
            }
        },
        'copy-cell-attachments': {
            cmd: _('copy cell attachments'),
            help    : _('copy cell attachments'),
            help_index: 'dzb',
            handler: function (env) {
                env.notebook.copy_cell_attachments();
            }
        },
        'paste-cell-attachments': {
            cmd: _('paste cell attachments'),
            help    : _('paste cell attachments'),
            help_index: 'dzc',
            handler: function (env) {
                env.notebook.paste_cell_attachments();
            }
        },
        'split-cell-at-cursor': {
            cmd: _('split cell at cursor'),
            help    : _('split cell at cursor'),
            help_index : 'ea',
            handler : function (env) {
                env.notebook.split_cell();
            }
        },
        'enter-edit-mode' : {
            cmd: _('enter edit mode'),
            help : _('enter edit mode'),
            help_index : 'aa',
            handler : function (env) {
                env.notebook.edit_mode();
            }
        },
        'select-previous-cell' : {
        	cmd: _('select previous cell'),
            help: _('select cell above'),
            help_index : 'da',
            handler : function (env) {
                var index = env.notebook.get_selected_index();
                if (index !== 0 && index !== null) {
                    env.notebook.select_prev(true);
                    env.notebook.focus_cell();
                }
            }
        },
        'select-next-cell' : {
        	cmd: _('select next cell'),
            help: _('select cell below'),
            help_index : 'db',
            handler : function (env) {
                var index = env.notebook.get_selected_index();
                if (index !== (env.notebook.ncells()-1) && index !== null) {
                    env.notebook.select_next(true);
                    env.notebook.focus_cell();
                }
            }
        },
        'extend-selection-above' : {
        	cmd: _('extend selection above'),
            help: _('extend selected cells above'),
            help_index : 'dc',
            handler : function (env) {
                env.notebook.extend_selection_by(-1);
                // scroll into view,
                // do not call notebook.focus_cell(), or
                // all the selection get thrown away
                env.notebook.get_selected_cell().element.focus();
            }
        },
        'extend-selection-below' : {
        	cmd: _('extend selection below'),
            help: _('extend selected cells below'),
            help_index : 'dd',
            handler : function (env) {
                env.notebook.extend_selection_by(1);
                // scroll into view,
                // do not call notebook.focus_cell(), or
                // all the selection get thrown away
                env.notebook.get_selected_cell().element.focus();
            }
        },
        'cut-cell' : {
            cmd: _('cut selected cells'),
            help: _('cut selected cells'),
            icon: 'fa-cut',
            help_index : 'ee',
            handler : function (env) {
                var index = env.notebook.get_selected_index();
                env.notebook.cut_cell();
                env.notebook.select(index);
            }
        },
        'copy-cell' : {
            cmd: _('copy selected cells'),
            help: _('copy selected cells'),
            icon: 'fa-copy',
            help_index : 'ef',
            handler : function (env) {
                env.notebook.copy_cell();
            }
        },
        'paste-cell-replace' : {
            help: 'paste cells replace',
            handler : function (env) {
                env.notebook.paste_cell_replace();
            }
        },
        'paste-cell-above' : {
            cmd: _('paste cells above'),
            help: _('paste cells above'),
            help_index : 'eg',
            handler : function (env) {
                env.notebook.paste_cell_above();
            }
        },
        'paste-cell-below' : {
            cmd: _('paste cells below'),
            help: _('paste cells below'),
            icon: 'fa-paste',
            help_index : 'eh',
            handler : function (env) {
                env.notebook.paste_cell_below();
            }
        },
        'insert-cell-above' : {
            cmd: _('insert cell above'),
            help: _('insert cell above'),
            help_index : 'ec',
            handler : function (env) {
                env.notebook.insert_cell_above();
                env.notebook.select_prev(true);
                env.notebook.focus_cell();
            }
        },
        'insert-cell-below' : {
            cmd: _('insert cell below'),
            help: _('insert cell below'),
            icon : 'fa-plus',
            help_index : 'ed',
            handler : function (env) {
                env.notebook.insert_cell_below();
                env.notebook.select_next(true);
                env.notebook.focus_cell();
            }
        },
        'change-cell-to-code' : {
            cmd: _('change cell to code'),
            help    : _('change cell to code'),
            help_index : 'ca',
            handler : function (env) {
                env.notebook.cells_to_code();
            }
        },
        'change-cell-to-markdown' : {
            cmd: _('change cell to markdown'),
            help    : _('change cell to markdown'),
            help_index : 'cb',
            handler : function (env) {
                env.notebook.cells_to_markdown();
            }
        },
        'change-cell-to-raw' : {
            cmd: _('change cell to raw'),
            help    : _('change cell to raw'),
            help_index : 'cc',
            handler : function (env) {
                env.notebook.cells_to_raw();
            }
        },
        'change-cell-to-heading-1' : {
            cmd: _('change cell to heading 1'),
            help    : _('change cell to heading 1'),
            help_index : 'cd',
            handler : function (env) {
                env.notebook.to_heading(undefined, 1);
            }
        },
        'change-cell-to-heading-2' : {
            cmd: _('change cell to heading 2'),
            help    : _('change cell to heading 2'),
            help_index : 'ce',
            handler : function (env) {
                env.notebook.to_heading(undefined, 2);
            }
        },
        'change-cell-to-heading-3' : {
            cmd: _('change cell to heading 3'),
            help    : _('change cell to heading 3'),
            help_index : 'cf',
            handler : function (env) {
                env.notebook.to_heading(undefined, 3);
            }
        },
        'change-cell-to-heading-4' : {
            cmd: _('change cell to heading 4'),
            help    : _('change cell to heading 4'),
            help_index : 'cg',
            handler : function (env) {
                env.notebook.to_heading(undefined, 4);
            }
        },
        'change-cell-to-heading-5' : {
            cmd: _('change cell to heading 5'),
            help    : _('change cell to heading 5'),
            help_index : 'ch',
            handler : function (env) {
                env.notebook.to_heading(undefined, 5);
            }
        },
        'change-cell-to-heading-6' : {
            cmd: _('change cell to heading 6'),
            help    : _('change cell to heading 6'),
            help_index : 'ci',
            handler : function (env) {
                env.notebook.to_heading(undefined, 6);
            }
        },
        'toggle-cell-output-collapsed' : {
        	cmd: _('toggle cell output'),
            help    : _('toggle output of selected cells'),
            help_index : 'gb',
            handler : function (env) {
                env.notebook.toggle_cells_outputs();
            }
        },
        'toggle-cell-output-scrolled' : {
        	cmd: _('toggle cell scrolling'),
            help    : _('toggle output scrolling of selected cells'),
            help_index : 'gc',
            handler : function (env) {
                env.notebook.toggle_cells_outputs_scroll();
            }
        },
        'clear-cell-output' : {
        	cmd: _('clear cell output'),
            help    : _('clear output of selected cells'),
            handler : function (env) {
                env.notebook.clear_cells_outputs();
            }
        },
        'move-cell-down' : {
        	cmd: _('move cells down'),
            help: _('move selected cells down'),
            icon: 'fa-arrow-down',
            help_index : 'eb',
            handler : function (env) {
                env.notebook.move_cell_down();
            }
        },
        'move-cell-up' : {
        	cmd: _('move cells up'),
            help: _('move selected cells up'),
            icon: 'fa-arrow-up',
            help_index : 'ea',
            handler : function (env) {
                env.notebook.move_cell_up();
            }
        },
        'toggle-cell-line-numbers' : {
            cmd: _('toggle line numbers'),
            help    : _('toggle line numbers'),
            help_index : 'ga',
            handler : function (env) {
                env.notebook.cell_toggle_line_numbers();
            }
        },
        'show-keyboard-shortcuts' : {
            cmd: _('show keyboard shortcuts'),
            help    : _('show keyboard shortcuts'),
            help_index : 'ge',
            handler : function (env) {
                env.quick_help.show_keyboard_shortcuts();
            }
        },
        'delete-cell': {
            cmd: _('delete cells'),
            help: _('delete selected cells'),
            help_index : 'ej',
            handler : function (env) {
                env.notebook.delete_cell();
            }
        },
        'undo-cell-deletion' : {
            cmd: _('undo cell deletion'),
            help: _('undo cell deletion'),
            help_index : 'ei',
            handler : function (env) {
                env.notebook.undelete_cell();
            }
        },
        // TODO reminder
        // open an issue, merge with above merge with last cell of notebook if at top.
        'merge-cell-with-previous-cell' : {
            cmd: _('merge cell with previous cell'),
            help    : _('merge cell above'),
            handler : function (env) {
                env.notebook.merge_cell_above();
            }
        },
        'merge-cell-with-next-cell' : {
            cmd: _('merge cell with next cell'),
            help    : _('merge cell below'),
            help_index : 'ek',
            handler : function (env) {
                env.notebook.merge_cell_below();
            }
        },
        'merge-selected-cells' : {
            cmd: _('merge selected cells'),
            help : _('merge selected cells'),
            help_index: 'el',
            handler: function(env) {
                env.notebook.merge_selected_cells();
            }
        },
        'merge-cells' : {
            cmd: _('merge cells'),
            help : _('merge selected cells, or current cell with cell below if only one cell is selected'),
            help_index: 'el',
            handler: function(env) {
                var l = env.notebook.get_selected_cells_indices().length;
                if(l == 1){
                    env.notebook.merge_cell_below();
                } else {
                    env.notebook.merge_selected_cells();
                }
            }
        },
        'show-command-palette': {
            help_index : 'aa',
            cmd: _('show command pallette'),
            help: _('open the command palette'),
            icon: 'fa-keyboard-o',
            handler : function(env){
                env.notebook.show_command_palette();
            }
        },
        'toggle-all-line-numbers': {
            cmd: _('toggle all line numbers'),
            help : _('toggles line numbers in all cells, and persist the setting'),
            icon: 'fa-list-ol',
            handler: function(env) {
                var value = !env.notebook.line_numbers;
                env.notebook.get_cells().map(function(c) {
                    c.code_mirror.setOption('lineNumbers', value);
                });
                env.notebook.line_numbers = value;
            }
        },
        'show-all-line-numbers': {
            cmd: _('show all line numbers'),
            help : _('show line numbers in all cells, and persist the setting'),
            handler: function(env) {
                env.notebook.get_cells().map(function(c) {
                    c.code_mirror.setOption('lineNumbers', true);
                });
                env.notebook.line_numbers = true;
            }
        },
        'hide-all-line-numbers': {
            cmd: _('hide all line numbers'),
            help : _('hide line numbers in all cells, and persist the setting'),
            handler: function(env) {
                env.notebook.get_cells().map(function(c) {
                    c.code_mirror.setOption('lineNumbers', false);
                });
                env.notebook.line_numbers = false;
            }
        },
        'toggle-header':{
            cmd: _('toggle header'),
            help: _('switch between showing and hiding the header'),
            handler : function(env) {
                var value = !env.notebook.header;
                if (value === true) {
                    $('#header-container').show();
                    $('.header-bar').show();
                } else if (value === false) {
                    $('#header-container').hide();
                    $('.header-bar').hide();
                }
                events.trigger('resize-header.Page');
                env.notebook.header = value;
            }
        },
        'show-header':{
            cmd: _('show the header'),
            help: _('show the header'),
            handler : function(env) {
                $('#header-container').show();
                $('.header-bar').show();
                events.trigger('resize-header.Page');
                env.notebook.header = true;
            }
        },
        'hide-header':{
            cmd: _('hide the header'),
            help: _('hide the header'),
            handler : function(env) {
                $('#header-container').hide();
                $('.header-bar').hide();
                events.trigger('resize-header.Page');
                env.notebook.header = false;
            }
        },
        'toggle-menubar':{
            help: 'hide/show the menu bar',
            handler : function(env) {
                $('#menubar-container').toggle();
                events.trigger('resize-header.Page');
            }
        },
        'show-menubar':{
            help: 'show the menu bar',
            handler : function(env) {
                $('#menubar-container').show();
                events.trigger('resize-header.Page');
            }
        },
        'hide-menubar':{
            help: 'hide the menu bar',
            handler : function(env) {
                $('#menubar-container').hide();
                events.trigger('resize-header.Page');
            }
        },
        'toggle-toolbar':{
            cmd: _('toggle toolbar'),
            help: _('switch between showing and hiding the toolbar'),
            handler : function(env) {
                var value = !env.notebook.toolbar;
                if (value === true) {
                    $('div#maintoolbar').show();
                } else if (value === false) {
                    $('div#maintoolbar').hide();
                }
                events.trigger('resize-header.Page');
                env.notebook.toolbar = value;
            }
        },
        'show-toolbar':{
            cmd: _('show the toolbar'),
            help: _('show the toolbar'),
            handler : function(env) {
                $('div#maintoolbar').show();
                events.trigger('resize-header.Page');
                env.notebook.toolbar = true;
            }
        },
        'hide-toolbar':{
            cmd: _('hide the toolbar'),
            help: _('hide the toolbar'),
            handler : function(env) {
                $('div#maintoolbar').hide();
                events.trigger('resize-header.Page');
                env.notebook.toolbar = false;
            }
        },
        'close-pager': {
            cmd: _('close the pager'),
            help : _('close the pager'),
            handler : function(env) {
                // Collapse the page if it is open
                if (env.pager && env.pager.expanded) {
                    env.pager.collapse();
                }
            }
        },
    };

    /**
     * A bunch of `Advance actions` for Jupyter.
     * Cf `Simple Action` plus the following properties.
     *
     * handler: first argument of the handler is the event that triggerd the action
     *      (typically keypress). The handler is responsible for any modification of the
     *      event and event propagation.
     *      Is also responsible for returning false if the event have to be further ignored,
     *      true, to tell keyboard manager that it ignored the event.
     *
     *      the second parameter of the handler is the environemnt passed to Simple Actions
     *
     **/
    var custom_ignore = {
        'ignore':{
            cmd: _('ignore'),
            handler : function () {
                return true;
            }
        },
        'move-cursor-up':{
            cmd: _('move cursor up'),
            help: _("move cursor up"),
            handler : function (env, event) {
                var index = env.notebook.get_selected_index();
                var cell = env.notebook.get_cell(index);
                var cm = env.notebook.get_selected_cell().code_mirror;
                var cur = cm.getCursor();
                if (cell && cell.at_top() && index !== 0 && cur.ch === 0) {
                    if(event){
                        event.preventDefault();
                    }
                    env.notebook.command_mode();
                    env.notebook.select_prev(true);
                    env.notebook.edit_mode();
                    cm = env.notebook.get_selected_cell().code_mirror;
                    cm.setCursor(cm.lastLine(), 0);
                }
                return false;
            }
        },
        'move-cursor-down':{
            cmd: _('move cursor down'),
            help: _("move cursor down"),
            handler : function (env, event) {
                var index = env.notebook.get_selected_index();
                var cell = env.notebook.get_cell(index);
                if (cell.at_bottom() && index !== (env.notebook.ncells()-1)) {
                    if(event){
                        event.preventDefault();
                    }
                    env.notebook.command_mode();
                    env.notebook.select_next(true);
                    env.notebook.edit_mode();
                    var cm = env.notebook.get_selected_cell().code_mirror;
                    cm.setCursor(0, 0);
                }
                return false;
            }
        },
        'scroll-notebook-down': {
            cmd: _('scroll notebook down'),
            help: _("scroll notebook down"),
            handler: function(env, event) {
                if(event){
                    event.preventDefault();
                }
                return env.notebook.scroll_manager.scroll(1);
            },
        },
        'scroll-notebook-up': {
            cmd: _('scroll notebook up'),
            help: _("scroll notebook up"),
            handler: function(env, event) {
                if(event){
                    event.preventDefault();
                }
                return env.notebook.scroll_manager.scroll(-1);
            },
        },
        'scroll-cell-center': {
            cmd: _('scroll cell center'),
            help: _("Scroll the current cell to the center"),
            handler: function (env, event) {
                if(event){
                    event.preventDefault();
                }
                var cell = env.notebook.get_selected_index();
                return env.notebook.scroll_cell_percent(cell, 50, 0);
            }
        },
        'scroll-cell-top': {
            cmd: _('scroll cell top'),
            help: _("Scroll the current cell to the top"),
            handler: function (env, event) {
                if(event){
                    event.preventDefault();
                }
                var cell = env.notebook.get_selected_index();
                return env.notebook.scroll_cell_percent(cell, 0, 0);
            }
        },
        'duplicate-notebook':{
            cmd: _('duplicate notebook'),
            help: _("Create and open a copy of the current notebook"),
            handler : function (env, event) {
                env.notebook.copy_notebook();
            }
        },
        'trust-notebook':{
            cmd: _('trust notebook'),
            help: _("Trust the current notebook"),
            handler : function (env, event) {
                env.notebook.trust_notebook();
            }
        },
        'rename-notebook':{
            cmd: _('rename notebook'),
            help: _("Rename the current notebook"),
            handler : function (env, event) {
                env.notebook.save_widget.rename_notebook({notebook: env.notebook});
            }
        },
        'toggle-all-cells-output-collapsed':{
            cmd: _('toggle all cells output collapsed'),
            help: _("Toggle the hidden state of all output areas"),
            handler : function (env, event) {
                env.notebook.toggle_all_output();
            }
        },
        'toggle-all-cells-output-scrolled':{
            cmd: _('toggle all cells output scrolled'),
            help: _("Toggle the scrolling state of all output areas"),
            handler : function (env, event) {
                env.notebook.toggle_all_output_scroll();
            }
        },

        'clear-all-cells-output':{
            cmd: _('clear all cells output'),
            help: _("Clear the content of all the outputs"),
            handler : function (env, event) {
                env.notebook.clear_all_output();
            }
        },
        'save-notebook':{
            cmd: _('save notebook'),
            help: _("Save and Checkpoint"),
            help_index : 'fb',
            icon: 'fa-save',
            handler : function (env, event) {
                env.notebook.save_checkpoint();
                if(event){
                    event.preventDefault();
                }
                return false;
            }
        },
    };

    // private stuff that prepend `jupyter-notebook:` to actions names
    // and uniformize/fill in missing pieces in of an action.
    var _prepare_handler = function(registry, subkey, source){
        registry['jupyter-notebook:'+subkey] = {};
        registry['jupyter-notebook:'+subkey].cmd = source[subkey].cmd;
        registry['jupyter-notebook:'+subkey].help = source[subkey].help||subkey.replace(/-/g,' ');
        registry['jupyter-notebook:'+subkey].help_index = source[subkey].help_index;
        registry['jupyter-notebook:'+subkey].icon = source[subkey].icon;
        return source[subkey].handler;
    };

    // Will actually generate/register all the Jupyter actions
    var fun = function(){
        var final_actions = {};
        var k;
        for(k in _actions){
            if(_actions.hasOwnProperty(k)){
                // Js closure are function level not block level need to wrap in a IIFE
                // and append jupyter-notebook: to event name these things do intercept event so are wrapped
                // in a function that return false.
                var handler = _prepare_handler(final_actions, k, _actions);
                (function(key, handler){
                    final_actions['jupyter-notebook:'+key].handler = function(env, event){
                        handler(env);
                        if(event){
                            event.preventDefault();
                        }
                        return false;
                    };
                })(k, handler);
            }
        }

        for(k in custom_ignore){
            // Js closure are function level not block level need to wrap in a IIFE
            // same as above, but decide for themselves whether or not they intercept events.
            if(custom_ignore.hasOwnProperty(k)){
                handler = _prepare_handler(final_actions, k, custom_ignore);
                (function(key, handler){
                    final_actions['jupyter-notebook:'+key].handler = function(env, event){
                        return handler(env, event);
                    };
                })(k, handler);
            }
        }

        return final_actions;
    };
    ActionHandler.prototype._actions = fun();


    /**
     *  extend the environment variable that will be pass to handlers
     **/
    ActionHandler.prototype.extend_env = function(env){
        for(var k in env){
            this.env[k] = env[k];
        }
    };

    ActionHandler.prototype.register = function(action, name, prefix){
        /**
         * Register an `action` with an optional name and prefix.
         *
         * if name and prefix are not given they will be determined automatically.
         * if action if just a `function` it will be wrapped in an anonymous action.
         *
         * @return the full name to access this action .
         **/
        action = this.normalise(action);
        if( !name ){
            name = 'autogenerated-'+String(action.handler);
        }
        prefix = prefix || 'auto';
        var full_name = prefix+':'+name;
        this._actions[full_name] = action;
        return full_name;

    };


    ActionHandler.prototype.normalise = function(data){
        /**
         * given an `action` or `function`, return a normalised `action`
         * by setting all known attributes and removing unknown attributes;
         **/
        if(typeof(data) === 'function'){
            data = {handler:data};
        }
        if(typeof(data.handler) !== 'function'){
            throw new Error('unknown datatype, cannot register');
        }
        var _data = data;
        data = {};
        data.handler = _data.handler;
        data.help = _data.help || '';
        data.icon = _data.icon || '';
        data.help_index = _data.help_index || '';
        return data;
    };

    ActionHandler.prototype.get_name = function(name_or_data){
        /**
         * given an `action` or `name` of a action, return the name attached to this action.
         * if given the name of and corresponding actions does not exist in registry, return `null`.
         **/

        if(typeof(name_or_data) === 'string'){
            warn_bad_name(name);
            if(this.exists(name_or_data)){
                return name_or_data;
            } else {
                return null;
            }
        } else {
            return this.register(name_or_data);
        }
    };

    ActionHandler.prototype.get = function(name){
        warn_bad_name(name);
        return this._actions[name];
    };

    ActionHandler.prototype.call = function(name, event, env){
        return this._actions[name].handler(env|| this.env, event);
    };

    ActionHandler.prototype.exists = function(name){
        return (typeof(this._actions[name]) !== 'undefined');
    };

    return {init:ActionHandler};

});
