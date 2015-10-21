// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'jquery',
    'base/js/utils',
    'base/js/dialog',
    'base/js/events',
], function($, utils, dialog, events) {
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
         * toggles display of keyboard shortcut dialog/side panel
         */
        var that = this;
        if ( this.force_rebuild ) {
            this.shortcut_element.remove();
            delete(this.shortcut_element);
            this.force_rebuild = false;
        }
        if (this.shortcut_element === undefined) {
            this.shortcut_element = this.build_keyboard_shortcuts();
        }

        if (this.display_location === 'side_panel') {
            if (this.shortcut_dialog !== undefined) this.shortcut_dialog.modal('hide');
            if (this.shortcut_panel === undefined) this.shortcut_panel = this.build_side_panel();
            this.shortcut_panel.find('.qh-panel-inner').append(this.shortcut_element);
            slide_side_panel(undefined, true);
        }
        else {
            if (this.shortcut_panel !== undefined) slide_side_panel(0);
            if (this.shortcut_dialog === undefined) {
                this.shortcut_dialog = dialog.modal({
                    show: false,
                    title : "Keyboard shortcuts",
                    body : this.shortcut_element,
                    destroy : false,
                    buttons : {
                        'Printable view' : {
                            click: function() {
                                that.display_location = 'side_panel';
                                that.show_keyboard_shortcuts();
                                slide_side_panel(100);
                            }
                        },
                        'Dock to side' : {
                            click: function() {
                                that.display_location = 'side_panel';
                                that.show_keyboard_shortcuts();
                            }
                        },
                        Close : {}
                    },
                    notebook: this.notebook,
                    keyboard_manager: this.keyboard_manager,
                });
                this.shortcut_dialog.addClass("modal_stretch");
            }
            else {
                this.shortcut_dialog.find('.modal-body').append(this.shortcut_element);
            }
            this.shortcut_dialog.modal('toggle');
        }

        this.events.on('rebuild.QuickHelp', function() { that.force_rebuild = true;});
    };

    QuickHelp.prototype.build_keyboard_shortcuts = function () {
        var element = $('<div/>');

        // The documentation
        var doc = this.build_doc();
        element.append(doc);

        // Command mode
        var cmd_div = this.build_command_help();
        element.append(cmd_div);

        // Edit mode
        var edit_div = this.build_edit_help(cm_shortcuts);
        element.append(edit_div);

        return element;
    };

    QuickHelp.prototype.build_doc = function () {
        var doc = $('<div/>').addClass('alert alert-info alert-dismissable');
        doc.append(
            $('<button/>', {
                type: "button",
                class: "close",
                'data-dismiss': "alert",
                'aria-label': "Close"
            }).append(
                $('<span/>', {'aria-hidden': "true"}).html('&times;')
            )
        );
        doc.append(
            '<p>' +
            'The Jupyter Notebook has two different keyboard input modes. <b>Edit mode</b> '+
            'allows you to type code/text into a cell and is indicated by a green cell '+
            'border. <b>Command mode</b> binds the keyboard to notebook level actions '+
            'and is indicated by a grey cell border.' +
            '</p>'
        );
        if (platform === 'MacOS') {
            var key_div = this.build_key_names();
            doc.append(key_div);
        }
        return doc;
    };

    QuickHelp.prototype.build_key_names = function () {
        var key_names_mac =  [{ shortcut:"⌘", help:"Command" },
                    { shortcut:"⌃", help:"Control" },
                    { shortcut:"⌥", help:"Option" },
                    { shortcut:"⇧", help:"Shift" },
                    { shortcut:"↩", help:"Return" },
                    { shortcut:"␣", help:"Space" },
                    { shortcut:"⇥", help:"Tab" }];
        return build_div('<span>MacOS modifier keys:</span>', key_names_mac, false);
    };


    QuickHelp.prototype.build_command_help = function () {
        var command_shortcuts = this.keyboard_manager.command_shortcuts.help();
        return build_div('<h4>Command Mode (press <kbd>Esc</kbd> to enable)</h4>', command_shortcuts);
    };

    
    QuickHelp.prototype.build_edit_help = function (cm_shortcuts) {
        var edit_shortcuts = this.keyboard_manager.edit_shortcuts.help();
        jQuery.merge(cm_shortcuts, edit_shortcuts);
        return build_div('<h4>Edit Mode (press <kbd>Enter</kbd> to enable)</h4>', cm_shortcuts);
    };

    QuickHelp.prototype.build_side_panel = function () {
        var that = this;

        var main_panel = $('#notebook_panel');

        var side_panel = $('<div/>')
            .addClass('qh-panel-outer')
            .hide()
            .insertAfter(main_panel);

        var side_panel_splitbar = $('<div/>')
            .addClass('qh-panel-splitbar')
            .append(
                $('<i/>').addClass('fa').text('|')
            )
            .appendTo(side_panel);

        var side_panel_inner = $('<div/>')
            .addClass('qh-panel-inner')
            .append(
                $('<div/>').addClass('modal-header hidden-print')
                .append(
                    $('<button/>').addClass('close').html('&times;')
                        .click(function () { slide_side_panel(0, true); })
                )
                .append($('<h4/>').addClass("modal-title").text('Keyboard shortcuts'))
            )
            .append(
                $('<div/>').addClass('btn-group qh-panel-btns hidden-print')
                    .append(
                        $('<a/>').addClass('btn btn-default')
                            .append($('<i/>').addClass('fa fa-fw fa-external-link fa-flip-horizontal'))
                            .append(' undock')
                            .click(function () {
                                that.display_location = undefined;
                                that.show_keyboard_shortcuts();
                            })
                    )
                    .append(
                        $('<a/>').addClass('btn btn-default')
                            .append($('<i/>').addClass('fa fa-fw fa-print'))
                            .append(' view')
                            .click(function () { slide_side_panel(100, true); })
                    )
            )
            .appendTo(side_panel);

        // bind events for resizing side panel
        side_panel_splitbar.mousedown(function (md_evt) {
            md_evt.preventDefault();
            $(document).mousemove(function (mm_evt) {
                mm_evt.preventDefault();
                var pix_w = side_panel.offset().left + side_panel.outerWidth() - mm_evt.pageX;
                var rel_w = 100 * pix_w / side_panel.parent().width();
                slide_side_panel(rel_w, false);
            });
            return false;
        });
        $(document).mouseup(function (mu_evt) {
            $(document).unbind('mousemove');
        });

        return side_panel;
    };

    var slide_side_panel = function (desired_width, animate) {

        var panel_min_width = 5, panel_max_width = 95;

        var main_panel = $('#notebook_panel');
        var side_panel = $('.qh-panel-outer');

        if (desired_width === undefined) {
            desired_width = side_panel.is(':hidden') ? (side_panel.data('last_width') || 40) : 0;
        }
        if (desired_width > panel_min_width && desired_width < panel_max_width) {
            side_panel.data('last_width',
                desired_width > panel_min_width ?
                    (desired_width < panel_max_width ? desired_width : panel_max_width) :
                    panel_min_width
            );
        }

        var anim_opts = {
            duration : animate ? 400 : 0,
            step : function (now, tween) {
                main_panel.css('width', 100 - now + '%');
            }
        };

        desired_width = desired_width >= panel_min_width ? desired_width : panel_min_width;

        if (desired_width <= panel_min_width) {
            anim_opts.complete = function () {
                side_panel.hide();
                main_panel.css({float: '', 'overflow-x': '', width: ''});
            };
        }
        else {
            main_panel.css({float: 'left', 'overflow-x': 'auto'});
            side_panel.show();
        }

        if (desired_width < panel_max_width) {
            side_panel.insertAfter(main_panel);
            $('#site,#header').filter(':hidden').slideDown({
                duration: anim_opts.duration,
                complete: function() { events.trigger('resize-header.Page'); }
            });
        }
        else {
            side_panel.insertAfter($('#site'));
            $('#site,#header').filter(':visible').slideUp(anim_opts.duration);
        }

        side_panel.animate({width: desired_width + '%'}, anim_opts);
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

    var build_div = function (title, shortcuts, make_panel) {
        if (make_panel === undefined) make_panel = true;

        // Remove jupyter-notebook:ignore shortcuts.
        shortcuts = shortcuts.filter(function(shortcut) {
            if (shortcut.help === 'ignore') {
                return false;
            } else {
                return true;
            }
        });
        
        var i, half, n;
        var wrap = $('<div/>').toggleClass('panel panel-default', make_panel);
        var head = $('<div/>').toggleClass('panel-heading', make_panel);
        var div = $('<div/>').toggleClass('panel-body', make_panel);
        var sub_div = $('<div/>').addClass('container-fluid');
        var col1 = $('<div/>').addClass('col-md-6');
        var col2 = $('<div/>').addClass('col-md-6');
        n = shortcuts.length;
        half = ~~(n/2);  // Truncate :)
        for (i=0; i<half; i++) { col1.append( build_one(shortcuts[i]) ); }
        for (i=half; i<n; i++) { col2.append( build_one(shortcuts[i]) ); }
        sub_div.append(col1).append(col2);
        div.append(sub_div);
        head.append($(title).toggleClass('panel-title', make_panel));
        wrap.append(head).append(div);
        return wrap;
    };

    return {'QuickHelp': QuickHelp,
        cm_shortcuts: cm_shortcuts,
        humanize_map: humanize_map,
        humanize_shortcut: humanize_shortcut,
        humanize_sequence: humanize_sequence
    };
});
