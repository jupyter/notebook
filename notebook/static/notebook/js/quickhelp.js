// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'jquery',
    'base/js/utils',
    'base/js/dialog',
    'underscore'
], function($, utils, dialog, _) {
    "use strict";

    var gettext = function(text) {
    	return utils.i18n.gettext(text);
    }    
    var platform = utils.platform;

    var QuickHelp = function (options) {
        /**
         * Constructor
         *
         * Parameters:
         *  options: dictionary
         *      Dictionary of keyword arguments.
         *          events: $(Events) instance
         *          keyboard_manager: KeyboardManager instance
         *          notebook: Notebook instance
         */
        this.keyboard_manager = options.keyboard_manager;
        this.notebook = options.notebook;
        this.keyboard_manager.quick_help = this;
        this.events = options.events;
    };

    var cmd_ctrl = 'Ctrl-';
    var platform_specific;

    if (platform === 'MacOS') {
        // Mac OS X specific
        cmd_ctrl = 'Cmd-';
        platform_specific = [
            { shortcut: "Cmd-Up",     help:gettext("go to cell start")  },
            { shortcut: "Cmd-Down",   help:gettext("go to cell end")  },
            { shortcut: "Alt-Left",   help:gettext("go one word left")  },
            { shortcut: "Alt-Right",  help:gettext("go one word right")  },
            { shortcut: "Alt-Backspace",      help:gettext("delete word before")  },
            { shortcut: "Alt-Delete",         help:gettext("delete word after")  },
        ];
    } else {
        // PC specific
        platform_specific = [
            { shortcut: "Ctrl-Home",  help:gettext("go to cell start")  },
            { shortcut: "Ctrl-Up",    help:gettext("go to cell start")  },
            { shortcut: "Ctrl-End",   help:gettext("go to cell end")  },
            { shortcut: "Ctrl-Down",  help:gettext("go to cell end")  },
            { shortcut: "Ctrl-Left",  help:gettext("go one word left")  },
            { shortcut: "Ctrl-Right", help:gettext("go one word right")  },
            { shortcut: "Ctrl-Backspace", help:gettext("delete word before")  },
            { shortcut: "Ctrl-Delete",    help:gettext("delete word after")  },
        ];
    }

    var cm_shortcuts = [
        { shortcut:"Tab",   help:gettext("code completion or indent") },
        { shortcut:"Shift-Tab",   help:gettext("tooltip") },
        { shortcut: cmd_ctrl + "]",   help:gettext("indent")  },
        { shortcut: cmd_ctrl + "[",   help:gettext("dedent")  },
        { shortcut: cmd_ctrl + "a",   help:gettext("select all")  },
        { shortcut: cmd_ctrl + "z",   help:gettext("undo")  },
        { shortcut: cmd_ctrl + "Shift-z",   help:gettext("redo")  },
        { shortcut: cmd_ctrl + "y",   help:gettext("redo")  },
    ].concat( platform_specific );
    
    var mac_humanize_map = {
        // all these are unicode, will probably display badly on anything except macs.
        // these are the standard symbol that are used in MacOS native menus
        // cf http://apple.stackexchange.com/questions/55727/
        // for htmlentities and/or unicode value
        'cmd':'⌘',
        'shift':'⇧',
        'alt':'⌥',
        'up':'↑',
        'down':'↓',
        'left':'←',
        'right':'→',
        'eject':'⏏',
        'tab':'⇥',
        'backtab':'⇤',
        'capslock':'⇪',
        'esc':'esc',
        'ctrl':'⌃',
        'enter':'↩',
        'pageup':'⇞',
        'pagedown':'⇟',
        'home':'↖',
        'end':'↘',
        'altenter':'⌤',
        'space':'␣',
        'delete':'⌦',
        'backspace':'⌫',
        'apple':'',
    };

    var default_humanize_map = {
        'shift':gettext('Shift'),
        'alt':gettext('Alt'),
        'up':gettext('Up'),
        'down':gettext('Down'),
        'left':gettext('Left'),
        'right':gettext('Right'),
        'tab':gettext('Tab'),
        'capslock':gettext('Caps Lock'),
        'esc':gettext('Esc'),
        'ctrl':gettext('Ctrl'),
        'enter':gettext('Enter'),
        'pageup':gettext('Page Up'),
        'pagedown':gettext('Page Down'),
        'home':gettext('Home'),
        'end':gettext('End'),
        'space':gettext('Space'),
        'backspace':gettext('Backspace'),
        '-':gettext('Minus')
        };
    
    var humanize_map;

    if (platform === 'MacOS'){
        humanize_map = mac_humanize_map;
    } else {
        humanize_map = default_humanize_map;
    }

    var special_case = { pageup: gettext("PageUp"), pagedown: gettext("Page Down") };
    
    function humanize_key(key){
        if (key.length === 1){
            return key.toUpperCase();
        }

        key = humanize_map[key.toLowerCase()]||key;
        
        if (key.indexOf(',') === -1){
            return  ( special_case[key] ? special_case[key] : key.charAt(0).toUpperCase() + key.slice(1) );
        }
    }

    // return an **html** string of the keyboard shortcut
    // for human eyes consumption.
    // the sequence is a string, comma sepparated linkt of shortcut,
    // where the shortcut is a list of dash-joined keys.
    // Each shortcut will be wrapped in <kbd> tag, and joined by comma is in a
    // sequence.
    //
    // Depending on the platform each shortcut will be normalized, with or without dashes.
    // and replace with the corresponding unicode symbol for modifier if necessary.
    function humanize_sequence(sequence){
        var joinchar = ',';
        var hum = _.map(sequence.replace(/meta/g, 'cmd').split(','), humanize_shortcut).join(joinchar);
        return hum;
    }

    function _humanize_sequence(sequence){
        var joinchar = ',';
        var hum = _.map(sequence.replace(/meta/g, 'cmd').split(','), _humanize_shortcut).join(joinchar);
        return hum;
    }

    function _humanize_shortcut(shortcut){
        var joinchar = '-';
        if (platform === 'MacOS'){
            joinchar = '';
        }
        return _.map(shortcut.split('-'), humanize_key ).join(joinchar);
    }

    function humanize_shortcut(shortcut){
        return '<kbd>'+_humanize_shortcut(shortcut)+'</kbd>';
    }
    

    QuickHelp.prototype.show_keyboard_shortcuts = function () {
        /**
         * toggles display of keyboard shortcut dialog
         */
        var that = this;
        if ( this.force_rebuild ) {
            this.shortcut_dialog.remove();
            delete(this.shortcut_dialog);
            this.force_rebuild = false;
        }
        if ( this.shortcut_dialog ){
            // if dialog is already shown, close it
            $(this.shortcut_dialog).modal("toggle");
            return;
        }
        var element = $('<div/>');

        // The documentation
        var doc = $('<div/>').addClass('alert alert-info');
        doc.append(gettext('The Jupyter Notebook has two different keyboard input modes.'))
           .append(' ')
           .append(gettext('<b>Edit mode</b> allows you to type code or text into a cell and is indicated by a green cell border.'))
           .append(' ')
           .append(gettext('<b>Command mode</b> binds the keyboard to notebook level commands and is indicated by a grey cell border with a blue left margin.')
        );
        element.append(doc);
        if (platform === 'MacOS') {
            doc = $('<div/>').addClass('alert alert-info');
            var key_div = this.build_key_names();
            doc.append(key_div);
            element.append(doc);
        }

        // Command mode
        var cmd_div = this.build_command_help();
        element.append(cmd_div);

        // Edit mode
        var edit_div = this.build_edit_help(cm_shortcuts);
        element.append(edit_div);

        // This statement is used simply so that message extraction
        // will pick up the strings.  The actual setting of the text
        // for the button is in dialog.js.
        var button_labels = [ gettext("Close") ];

        this.shortcut_dialog = dialog.modal({
            title : gettext("Keyboard shortcuts"),
            body : element,
            destroy : false,
            buttons : {
                Close : {}
            },
            notebook: this.notebook,
            keyboard_manager: this.keyboard_manager,
        });
        this.shortcut_dialog.addClass("modal_stretch");
        
        this.events.on('rebuild.QuickHelp', function() { that.force_rebuild = true;});
    };

    QuickHelp.prototype.build_key_names = function () {
       var key_names_mac =  [{ shortcut:"⌘", help:gettext("Command") },
                    { shortcut:"⌃", help:gettext("Control") },
                    { shortcut:"⌥", help:gettext("Option") },
                    { shortcut:"⇧", help:gettext("Shift") },
                    { shortcut:"↩", help:gettext("Return") },
                    { shortcut:"␣", help:gettext("Space") },
                    { shortcut:"⇥", help:gettext("Tab") }];
        var i, half, n;
        var div = $('<div/>').append('Mac OS X modifier keys:');
        var sub_div = $('<div/>').addClass('container-fluid');
        var col1 = $('<div/>').addClass('col-md-6');
        var col2 = $('<div/>').addClass('col-md-6');
        n = key_names_mac.length;
        half = ~~(n/2);
        for (i=0; i<half; i++) { col1.append(
                build_one(key_names_mac[i])
                ); }
        for (i=half; i<n; i++) { col2.append(
                build_one(key_names_mac[i])
                ); }
        sub_div.append(col1).append(col2);
        div.append(sub_div);
        return div;
    };


    QuickHelp.prototype.build_command_help = function () {
        var that = this;
        var command_shortcuts = this.keyboard_manager.command_shortcuts.help();
        var cmdkey = '<kbd>'+gettext('Esc')+'</kbd>';
        var div = build_div('<h4>'+utils.i18n.sprintf(gettext('Command Mode (press %s to enable)'),cmdkey)+'</h4>', command_shortcuts);
        var edit_button = $('<button/>')
            .text(gettext("Edit Shortcuts"))
            .addClass('btn btn-xs btn-default pull-right')
            .attr('href', '#')
            .attr('title', gettext('edit command-mode keyboard shortcuts'))
            .click(function () {
                // close this dialog
                $(that.shortcut_dialog).modal("toggle");
                // and open the next one
                that.keyboard_manager.actions.call(
                    'jupyter-notebook:edit-command-mode-keyboard-shortcuts');
            });
        div.find('h4').append(edit_button);
        return div;
    };

    
    QuickHelp.prototype.build_edit_help = function (cm_shortcuts) {
        var edit_shortcuts = this.keyboard_manager.edit_shortcuts.help();
        var enterkey = '<kbd>'+gettext('Enter')+'</kbd>';
        edit_shortcuts = $.merge($.merge([], cm_shortcuts), edit_shortcuts);
        return build_div('<h4>'+utils.i18n.sprintf(gettext('Edit Mode (press %s to enable)'),enterkey)+'</h4>', edit_shortcuts);
        edit_shortcuts = jQuery.merge(jQuery.merge([], cm_shortcuts), edit_shortcuts);
    };

    var build_one = function (s) {
        var help = s.help;
        var shortcut = '';
        if(s.shortcut){
            shortcut = humanize_sequence(s.shortcut);
        }
        return $('<div>').addClass('quickhelp').
            append($('<span/>').addClass('shortcut_key').append($(shortcut))).
            append($('<span/>').addClass('shortcut_descr').text(' : ' + help));

    };

    var build_div = function (title, shortcuts) {
        
        // Remove jupyter-notebook:ignore shortcuts.
        shortcuts = shortcuts.filter(function(shortcut) {
            if (shortcut.help === 'ignore') {
                return false;
            } else {
                return true;
            }
        });
        
        var i, half, n;
        var div = $('<div/>').append($(title));
        var sub_div = $('<div/>').addClass('container-fluid');
        var col1 = $('<div/>').addClass('col-md-6');
        var col2 = $('<div/>').addClass('col-md-6');
        n = shortcuts.length;
        half = ~~(n/2);  // Truncate :)
        for (i=0; i<half; i++) { col1.append( build_one(shortcuts[i]) ); }
        for (i=half; i<n; i++) { col2.append( build_one(shortcuts[i]) ); }
        sub_div.append(col1).append(col2);
        div.append(sub_div);
        return div;
    };

    return {'QuickHelp': QuickHelp,
      humanize_shortcut: humanize_shortcut,
      humanize_sequence: humanize_sequence,
      _humanize_sequence: _humanize_sequence,
  };
});
