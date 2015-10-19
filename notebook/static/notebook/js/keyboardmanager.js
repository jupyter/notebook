// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/**
 *
 *
 * @module keyboardmanager
 * @namespace keyboardmanager
 * @class KeyboardManager
 */

define([
    'jquery',
    'base/js/utils',
    'base/js/keyboard',
], function($, utils, keyboard) {
    "use strict";
    
    // Main keyboard manager for the notebook
    var keycodes = keyboard.keycodes;

    var KeyboardManager = function (options) {
        /**
         * A class to deal with keyboard event and shortcut
         *
         * @class KeyboardManager
         * @constructor
         * @param options {dict} Dictionary of keyword arguments :
         *    @param options.events {$(Events)} instance 
         *    @param options.pager: {Pager}  pager instance
         */
        this.mode = 'command';
        this.enabled = true;
        this.pager = options.pager;
        this.quick_help = undefined;
        this.notebook = undefined;
        this.last_mode = undefined;
        this.bind_events();
        this.env = {pager:this.pager};
        this.actions = options.actions;
        this.command_shortcuts = new keyboard.ShortcutManager(undefined, options.events, this.actions, this.env );
        this.command_shortcuts.add_shortcuts(this.get_default_common_shortcuts());
        this.command_shortcuts.add_shortcuts(this.get_default_command_shortcuts());
        this.edit_shortcuts = new keyboard.ShortcutManager(undefined, options.events, this.actions, this.env);
        this.edit_shortcuts.add_shortcuts(this.get_default_common_shortcuts());
        this.edit_shortcuts.add_shortcuts(this.get_default_edit_shortcuts());
        Object.seal(this);
    };




    /**
     * Return a dict of common shortcut
     * @method get_default_common_shortcuts
     *
     * @example Example of returned shortcut
     * ```
     * 'shortcut-key': 'action-name'
     * // a string representing the shortcut as dash separated value.
     * // e.g. 'shift' , 'shift-enter', 'cmd-t'
     *```
     */
    KeyboardManager.prototype.get_default_common_shortcuts = function() {
        return {
            'shift'       : 'jp-notebook:ignore',
            'shift-enter' : 'jp-notebook:run-cell-and-select-next',
            'ctrl-enter'  : 'jp-notebook:run-cell',
            'alt-enter'   : 'jp-notebook:run-cell-and-insert-below',
            // cmd on mac, ctrl otherwise
            'cmdtrl-s'    : 'jp-notebook:save-notebook',
        };
    };

    KeyboardManager.prototype.get_default_edit_shortcuts = function() {
        return {
            'cmdtrl-shift-p'      : 'jp-notebook:show-command-palette',
            'esc'                 : 'jp-notebook:enter-command-mode',
            'ctrl-m'              : 'jp-notebook:enter-command-mode',
            'up'                  : 'jp-notebook:move-cursor-up',
            'down'                : 'jp-notebook:move-cursor-down',
            'ctrl-shift--'        : 'jp-notebook:split-cell-at-cursor',
            'ctrl-shift-subtract' : 'jp-notebook:split-cell-at-cursor',
        };
    };

    KeyboardManager.prototype.get_default_command_shortcuts = function() {
        return {
            'cmdtrl-shift-p': 'jp-notebook:show-command-palette',
            'shift-space': 'jp-notebook:scroll-notebook-up',
            'shift-v' : 'jp-notebook:paste-cell-above',
            'shift-m' : 'jp-notebook:merge-cells',
            'shift-o' : 'jp-notebook:toggle-cell-output-scrolling',
            'enter' : 'jp-notebook:enter-edit-mode',
            'space' : 'jp-notebook:scroll-notebook-down',
            'down' : 'jp-notebook:select-next-cell',
            'i,i' : 'jp-notebook:interrupt-kernel',
            '0,0' : 'jp-notebook:confirm-restart-kernel',
            'd,d' : 'jp-notebook:delete-cell',
            'esc': 'jp-notebook:close-pager',
            'up' : 'jp-notebook:select-previous-cell',
            'k' : 'jp-notebook:select-previous-cell',
            'j' : 'jp-notebook:select-next-cell',
            'shift-k': 'jp-notebook:extend-marked-cells-above',
            'shift-j': 'jp-notebook:extend-marked-cells-below',
            'shift-up': 'jp-notebook:extend-marked-cells-above',
            'shift-down': 'jp-notebook:extend-marked-cells-below',
            'x' : 'jp-notebook:cut-cell',
            'c' : 'jp-notebook:copy-cell',
            'v' : 'jp-notebook:paste-cell-below',
            'a' : 'jp-notebook:insert-cell-above',
            'b' : 'jp-notebook:insert-cell-below',
            'y' : 'jp-notebook:change-cell-to-code',
            'm' : 'jp-notebook:change-cell-to-markdown',
            'r' : 'jp-notebook:change-cell-to-raw',
            '1' : 'jp-notebook:change-cell-to-heading-1',
            '2' : 'jp-notebook:change-cell-to-heading-2',
            '3' : 'jp-notebook:change-cell-to-heading-3',
            '4' : 'jp-notebook:change-cell-to-heading-4',
            '5' : 'jp-notebook:change-cell-to-heading-5',
            '6' : 'jp-notebook:change-cell-to-heading-6',
            'o' : 'jp-notebook:toggle-cell-output-visibility',
            's' : 'jp-notebook:save-notebook',
            'l' : 'jp-notebook:toggle-cell-line-numbers',
            'h' : 'jp-notebook:show-keyboard-shortcuts',
            'z' : 'jp-notebook:undo-cell-deletion',
            'q' : 'jp-notebook:close-pager',
        };
    };

    KeyboardManager.prototype.bind_events = function () {
        var that = this;
        $(document).keydown(function (event) {
            if(event._ipkmIgnore===true||(event.originalEvent||{})._ipkmIgnore===true){
                return false;
            }
            return that.handle_keydown(event);
        });
    };

    KeyboardManager.prototype.set_notebook = function (notebook) {
        this.notebook = notebook;
        this.actions.extend_env({notebook:notebook});
    };
    
    KeyboardManager.prototype.set_quickhelp = function (notebook) {
        this.actions.extend_env({quick_help:notebook});
    };


    KeyboardManager.prototype.handle_keydown = function (event) {
        /**
         *  returning false from this will stop event propagation
         **/

        if (event.which === keycodes.esc) {
            // Intercept escape at highest level to avoid closing
            // websocket connection with firefox
            event.preventDefault();
        }
        
        if (!this.enabled) {
            if (event.which === keycodes.esc) {
                this.notebook.command_mode();
                return false;
            }
            return true;
        }
        
        if (this.mode === 'edit') {
            return this.edit_shortcuts.call_handler(event);
        } else if (this.mode === 'command') {
            return this.command_shortcuts.call_handler(event);
        }
        return true;
    };

    KeyboardManager.prototype.edit_mode = function () {
        this.last_mode = this.mode;
        this.mode = 'edit';
    };

    KeyboardManager.prototype.command_mode = function () {
        this.last_mode = this.mode;
        this.mode = 'command';
    };

    KeyboardManager.prototype.enable = function () {
        this.enabled = true;
    };

    KeyboardManager.prototype.disable = function () {
        this.enabled = false;
    };

    KeyboardManager.prototype.register_events = function (e) {
        e = $(e);
        var that = this;
        var handle_focus = function () {
            that.disable();
        };
        var handle_blur = function () {
            that.enable();
        };
        e.on('focusin', handle_focus);
        e.on('focusout', handle_blur);
        // TODO: Very strange. The focusout event does not seem fire for the 
        // bootstrap textboxes on FF25&26...  This works around that by 
        // registering focus and blur events recursively on all inputs within
        // registered element.
        e.find('input').blur(handle_blur);
        e.on('DOMNodeInserted', function (event) {
            var target = $(event.target);
            if (target.is('input')) {
                target.blur(handle_blur);
            } else {
                target.find('input').blur(handle_blur);    
            }
          });
        // There are times (raw_input) where we remove the element from the DOM before
        // focusout is called. In this case we bind to the remove event of jQueryUI,
        // which gets triggered upon removal, iff it is focused at the time.
        // is_focused must be used to check for the case where an element within
        // the element being removed is focused.
        e.on('remove', function () {
            if (utils.is_focused(e[0])) {
                that.enable();
            }
        });
    };

    return {'KeyboardManager': KeyboardManager};
});
