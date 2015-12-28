// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'jquery',
    'base/js/utils',
    'base/js/dialog',
], function($, utils, dialog) {
    "use strict";
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
            { shortcut: "Cmd-Up",     help:"go to cell start"  },
            { shortcut: "Cmd-Down",   help:"go to cell end"  },
            { shortcut: "Alt-Left",   help:"go one word left"  },
            { shortcut: "Alt-Right",  help:"go one word right"  },
            { shortcut: "Alt-Backspace",      help:"delete word before"  },
            { shortcut: "Alt-Delete",         help:"delete word after"  },
        ];
    } else {
        // PC specific
        platform_specific = [
            { shortcut: "Ctrl-Home",  help:"go to cell start"  },
            { shortcut: "Ctrl-Up",     help:"go to cell start"  },
            { shortcut: "Ctrl-End",   help:"go to cell end"  },
            { shortcut: "Ctrl-Down",  help:"go to cell end"  },
            { shortcut: "Ctrl-Left",  help:"go one word left"  },
            { shortcut: "Ctrl-Right", help:"go one word right"  },
            { shortcut: "Ctrl-Backspace", help:"delete word before"  },
            { shortcut: "Ctrl-Delete",    help:"delete word after"  },
        ];
    }

    var cm_shortcuts = [
        { shortcut:"Tab",   help:"code completion or indent" },
        { shortcut:"Shift-Tab",   help:"tooltip" },
        { shortcut: cmd_ctrl + "]",   help:"indent"  },
        { shortcut: cmd_ctrl + "[",   help:"dedent"  },
        { shortcut: cmd_ctrl + "a",   help:"select all"  },
        { shortcut: cmd_ctrl + "z",   help:"undo"  },
        { shortcut: cmd_ctrl + "Shift-z",   help:"redo"  },
        { shortcut: cmd_ctrl + "y",   help:"redo"  },
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
        'shift':'Shift',
        'alt':'Alt',
        'up':'Up',
        'down':'Down',
        'left':'Left',
        'right':'Right',
        'tab':'Tab',
        'capslock':'Caps Lock',
        'esc':'Esc',
        'ctrl':'Ctrl',
        'enter':'Enter',
        'pageup':'Page Up',
        'pagedown':'Page Down',
        'home':'Home',
        'end':'End',
        'space':'Space',
        'backspace':'Backspace',
        };
    
    var humanize_map;

    if (platform === 'MacOS'){
        humanize_map = mac_humanize_map;
    } else {
        humanize_map = default_humanize_map;
    }

    var special_case = { pageup: "PageUp", pagedown: "Page Down", 'minus': '-' };
    
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

    function humanize_shortcut(shortcut){
        var joinchar = '-';
        if (platform === 'MacOS'){
            joinchar = '';
        }
        var sh = _.map(shortcut.split('-'), humanize_key ).join(joinchar);
        return '<kbd>'+sh+'</kbd>';
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
        var command_shortcuts = this.keyboard_manager.command_shortcuts.help();
        var edit_shortcuts = this.keyboard_manager.edit_shortcuts.help();
        var help, shortcut;
        var i, half, n;
        var element = $('<div/>');

        // The documentation
        var doc = $('<div/>').addClass('alert alert-info');
        doc.append(
            'The Jupyter Notebook has two different keyboard input modes. <b>Edit mode</b> '+
            'allows you to type code/text into a cell and is indicated by a green cell '+
            'border. <b>Command mode</b> binds the keyboard to notebook level actions '+
            'and is indicated by a grey cell border with a blue left margin.'
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

        this.shortcut_dialog = dialog.modal({
            title : "Keyboard shortcuts",
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
       var key_names_mac =  [{ shortcut:"⌘", help:"Command" },
                    { shortcut:"⌃", help:"Control" },
                    { shortcut:"⌥", help:"Option" },
                    { shortcut:"⇧", help:"Shift" },
                    { shortcut:"↩", help:"Return" },
                    { shortcut:"␣", help:"Space" },
                    { shortcut:"⇥", help:"Tab" }];
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
        var command_shortcuts = this.keyboard_manager.command_shortcuts.help();
        return build_div('<h4>Command Mode (press <kbd>Esc</kbd> to enable)</h4>', command_shortcuts);
    };

    
    QuickHelp.prototype.build_edit_help = function (cm_shortcuts) {
        var edit_shortcuts = this.keyboard_manager.edit_shortcuts.help();
        edit_shortcuts = jQuery.merge(jQuery.merge([], cm_shortcuts), edit_shortcuts);
        return build_div('<h4>Edit Mode (press <kbd>Enter</kbd> to enable)</h4>', edit_shortcuts);
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
      humanize_sequence: humanize_sequence
  };
});
