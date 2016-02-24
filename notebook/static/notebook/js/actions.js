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


define(function(require){
    "use strict";

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
        'restart-kernel': {
            help: 'restart the kernel (no confirmation dialog)',
            handler: function (env) {
                env.notebook.restart_kernel({confirm: false});
            },
        },
        'confirm-restart-kernel':{
            icon: 'fa-repeat',
            help_index : 'hb',
            help: 'restart the kernel (with dialog)',
            handler : function (env) {
                env.notebook.restart_kernel();
            }
        },
        'restart-kernel-and-run-all-cells': {
            help: 'restart the kernel, then re-run the whole notebook (no confirmation dialog)',
            handler: function (env) {
                env.notebook.restart_run_all({confirm: false});
            }
        },
        'confirm-restart-kernel-and-run-all-cells': {
            help: 'restart the kernel, then re-run the whole notebook (with dialog)',
            handler: function (env) {
                env.notebook.restart_run_all();
            }
        },
        'restart-kernel-and-clear-output': {
            help: 'restart the kernel and clear all output (no confirmation dialog)',
            handler: function (env) {
                env.notebook.restart_clear_output({confirm: false});
            }
        },
        'confirm-restart-kernel-and-clear-output': {
            help: 'restart the kernel and clear all output (with dialog)',
            handler: function (env) {
                env.notebook.restart_clear_output();
            }
        },
        'interrupt-kernel':{
            icon: 'fa-stop',
            help_index : 'ha',
            handler : function (env) {
                env.notebook.kernel.interrupt();
            }
        },
        'run-cell-and-select-next': {
            icon: 'fa-step-forward',
            help    : 'run cell, select below',
            help_index : 'ba',
            handler : function (env) {
                env.notebook.execute_cell_and_select_below();
            }
        },
        'run-cell':{
            help    : 'run selected cells',
            help_index : 'bb',
            handler : function (env) {
                env.notebook.execute_selected_cells();
            }
        },
        'run-cell-and-insert-below':{
            help    : 'run cell, insert below',
            help_index : 'bc',
            handler : function (env) {
                env.notebook.execute_cell_and_insert_below();
            }
        },
        'run-all-cells': {
            help: 'run all cells',
            help_index: 'bd',
            handler: function (env) {
                env.notebook.execute_all_cells();
            }
        },
        'run-all-cells-above':{
            handler : function (env) {
                env.notebook.execute_cells_above();
            }
        },
        'run-all-cells-below':{
            handler : function (env) {
                env.notebook.execute_cells_below();
            }
        },
        'enter-command-mode': {
            help    : 'command mode',
            help_index : 'aa',
            handler : function (env) {
                env.notebook.command_mode();
            }
        },
        'split-cell-at-cursor': {
            help    : 'split cell',
            help_index : 'ea',
            handler : function (env) {
                env.notebook.split_cell();
            }
        },
        'enter-edit-mode' : {
            help_index : 'aa',
            handler : function (env) {
                env.notebook.edit_mode();
            }
        },
        'select-previous-cell' : {
            help: 'select cell above',
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
            help: 'select cell below',
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
            help: 'extend selected cells above',
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
            help: 'extend selected cells below',
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
            help: 'cut selected cells',
            icon: 'fa-cut',
            help_index : 'ee',
            handler : function (env) {
                var index = env.notebook.get_selected_index();
                env.notebook.cut_cell();
                env.notebook.select(index);
            }
        },
        'copy-cell' : {
            help: 'copy selected cells',
            icon: 'fa-copy',
            help_index : 'ef',
            handler : function (env) {
                env.notebook.copy_cell();
            }
        },
        'paste-cell-above' : {
            help: 'paste cells above',
            help_index : 'eg',
            handler : function (env) {
                env.notebook.paste_cell_above();
            }
        },
        'paste-cell-below' : {
            help: 'paste cells below',
            icon: 'fa-paste',
            help_index : 'eh',
            handler : function (env) {
                env.notebook.paste_cell_below();
            }
        },
        'insert-cell-above' : {
            help: 'insert cell above',
            help_index : 'ec',
            handler : function (env) {
                env.notebook.insert_cell_above();
                env.notebook.select_prev(true);
                env.notebook.focus_cell();
            }
        },
        'insert-cell-below' : {
            help: 'insert cell below',
            icon : 'fa-plus',
            help_index : 'ed',
            handler : function (env) {
                env.notebook.insert_cell_below();
                env.notebook.select_next(true);
                env.notebook.focus_cell();
            }
        },
        'change-cell-to-code' : {
            help    : 'to code',
            help_index : 'ca',
            handler : function (env) {
                env.notebook.cells_to_code();
            }
        },
        'change-cell-to-markdown' : {
            help    : 'to markdown',
            help_index : 'cb',
            handler : function (env) {
                env.notebook.cells_to_markdown();
            }
        },
        'change-cell-to-raw' : {
            help    : 'to raw',
            help_index : 'cc',
            handler : function (env) {
                env.notebook.cells_to_raw();
            }
        },
        'change-cell-to-heading-1' : {
            help    : 'to heading 1',
            help_index : 'cd',
            handler : function (env) {
                env.notebook.to_heading(undefined, 1);
            }
        },
        'change-cell-to-heading-2' : {
            help    : 'to heading 2',
            help_index : 'ce',
            handler : function (env) {
                env.notebook.to_heading(undefined, 2);
            }
        },
        'change-cell-to-heading-3' : {
            help    : 'to heading 3',
            help_index : 'cf',
            handler : function (env) {
                env.notebook.to_heading(undefined, 3);
            }
        },
        'change-cell-to-heading-4' : {
            help    : 'to heading 4',
            help_index : 'cg',
            handler : function (env) {
                env.notebook.to_heading(undefined, 4);
            }
        },
        'change-cell-to-heading-5' : {
            help    : 'to heading 5',
            help_index : 'ch',
            handler : function (env) {
                env.notebook.to_heading(undefined, 5);
            }
        },
        'change-cell-to-heading-6' : {
            help    : 'to heading 6',
            help_index : 'ci',
            handler : function (env) {
                env.notebook.to_heading(undefined, 6);
            }
        },
        'toggle-cell-output-collapsed' : {
            help    : 'toggle output of selected cells',
            help_index : 'gb',
            handler : function (env) {
                env.notebook.toggle_cells_outputs();
            }
        },
        'toggle-cell-output-scrolled' : {
            help    : 'toggle output scrolling of selected cells',
            help_index : 'gc',
            handler : function (env) {
                env.notebook.toggle_cells_outputs_scroll();
            }
        },
        'clear-cell-output' : {
            help    : 'clear output of selected cells',
            handler : function (env) {
                env.notebook.clear_cells_outputs();
            }
        },
        'move-cell-down' : {
            help: 'move selected cells down',
            icon: 'fa-arrow-down',
            help_index : 'eb',
            handler : function (env) {
                env.notebook.move_cell_down();
            }
        },
        'move-cell-up' : {
            help: 'move selected cells up',
            icon: 'fa-arrow-up',
            help_index : 'ea',
            handler : function (env) {
                env.notebook.move_cell_up();
            }
        },
        'toggle-cell-line-numbers' : {
            help    : 'toggle line numbers',
            help_index : 'ga',
            handler : function (env) {
                env.notebook.cell_toggle_line_numbers();
            }
        },
        'show-keyboard-shortcuts' : {
            help_index : 'ge',
            handler : function (env) {
                env.quick_help.show_keyboard_shortcuts();
            }
        },
        'delete-cell': {
            help: 'delete selected cells',
            help_index : 'ej',
            handler : function (env) {
                env.notebook.delete_cell();
            }
        },
        'undo-cell-deletion' : {
            help_index : 'ei',
            handler : function (env) {
                env.notebook.undelete_cell();
            }
        },
        // TODO reminder
        // open an issue, merge with above merge with last cell of notebook if at top. 
        'merge-cell-with-previous-cell' : {
            handler : function (env) {
                env.notebook.merge_cell_above();
            }
        },
        'merge-cell-with-next-cell' : {
            help    : 'merge cell below',
            help_index : 'ek',
            handler : function (env) {
                env.notebook.merge_cell_below();
            }
        },
        'merge-selected-cells' : {
            help : 'merge selected cells',
            help_index: 'el',
            handler: function(env) {
                env.notebook.merge_selected_cells();
            }
        },
        'merge-cells' : {
            help : 'merge selected cells, or current cell with cell below if only one cell selected',
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
            help: 'open the command palette',
            icon: 'fa-keyboard-o',
            handler : function(env){
                env.notebook.show_command_palette();
            }
        },
        'toggle-toolbar':{
            help: 'hide/show the toolbar',
            handler : function(env){
                $('div#maintoolbar').toggle();
                events.trigger('resize-header.Page');
            }
        },
        'toggle-header':{
            help: 'hide/show the header',
            handler : function(env){
                $('#header-container').toggle();
                $('.header-bar').toggle();
                events.trigger('resize-header.Page');
            }
        },
        'close-pager': {
            help : 'close the pager',
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
            handler : function () {
                return true;
            }
        },
        'move-cursor-up':{
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
            handler: function(env, event) {
                if(event){
                    event.preventDefault();
                }
                return env.notebook.scroll_manager.scroll(1);
            },
        },
        'scroll-notebook-up': {
            handler: function(env, event) {
                if(event){
                    event.preventDefault();
                }
                return env.notebook.scroll_manager.scroll(-1);
            },
        },
        'scroll-cell-center': {
            help: "Scroll the current cell to the center",
            handler: function (env, event) {
                if(event){
                    event.preventDefault();
                }
                var cell = env.notebook.get_selected_index();
                return env.notebook.scroll_cell_percent(cell, 50, 0);
            }
        },
        'scroll-cell-top': {
            help: "Scroll the current cell to the top",
            handler: function (env, event) {
                if(event){
                    event.preventDefault();
                }
                var cell = env.notebook.get_selected_index();
                return env.notebook.scroll_cell_percent(cell, 0, 0);
            }
        },
        'duplicate-notebook':{
            help: "Create an open a copy of current notebook",
            handler : function (env, event) {
                env.notebook.copy_notebook();
            }
        },
        'trust-notebook':{
            help: "Trust the current notebook",
            handler : function (env, event) {
                env.notebook.trust_notebook();
            }
        },
        'rename-notebook':{
            help: "Rename current notebook",
            handler : function (env, event) {
                env.notebook.save_widget.rename_notebook({notebook: env.notebook});
            }
        },
        'toggle-all-cells-output-collapsed':{
            help: "Toggle the hiddens state of all output areas",
            handler : function (env, event) {
                env.notebook.toggle_all_output();
            }
        },
        'toggle-all-cells-output-scrolled':{
            help: "Toggle the scrolling state of all output areas",
            handler : function (env, event) {
                env.notebook.toggle_all_output_scroll();
            }
        },

        'clear-all-cells-output':{
            help: "Clear the content of all the outputs",
            handler : function (env, event) {
                env.notebook.clear_all_output();
            }
        },
        'save-notebook':{
            help: "Save and Checkpoint",
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
            throw('unknown datatype, cannot register');
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
