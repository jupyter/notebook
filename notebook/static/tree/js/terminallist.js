// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'jquery',
    'base/js/namespace',
    'base/js/utils',
    'base/js/i18n',
    'tree/js/notebooklist',
    'bidi/bidi'
], function($, IPython, utils, i18n, notebooklist, bidi) {
    "use strict";

    var TerminalList = function (selector, options) {
        /**
         * Constructor
         *
         * Parameters:
         *  selector: string
         *  options: dictionary
         *      Dictionary of keyword arguments.
         *          base_url: string
         */
        this.base_url = options.base_url || utils.get_body_data("baseUrl");
        this.element_name = options.element_name || 'running';
        this.selector = selector;
        this.terminals = [];
        this.selected = [];
        this.element = $('#terminal_list');
        this.style();
        this.bind_events();
        this.load_terminals();

    };

    TerminalList.prototype = Object.create(notebooklist.NotebookList.prototype);

    TerminalList.prototype.bind_events = function () {
        var that = this;
        $('#refresh_' + this.element_name + '_list').click(function () {
            that.load_terminals();
        });
        $('#new-terminal').click($.proxy(this.new_terminal, this));
        $('#' + this.element_name + '_toolbar').find('.shutdown-button').click($.proxy(this.shutdown_selected, this));

        var select_all = $(that.selector).find('#select-all');
        select_all.change(function () {
            if (!select_all.prop('checked') || select_all.data('indeterminate')) {
                that.select('select-none');
            } else {
                that.select('select-all');
            }
        });
        $(that.selector).find('#button-select-all').click(function (e) {
            // toggle checkbox if the click doesn't come from the checkbox already
            if (!$(e.target).is('input[type=checkbox]')) {
                if (select_all.prop('checked') || select_all.data('indeterminate')) {
                    that.select('select-none');
                } else {
                    that.select('select-all');
                }
            }
        });
    };

    TerminalList.prototype.new_terminal = function (event) {
        if (event) {
            event.preventDefault();
        }
        var w = window.open('#', IPython._target);
        var base_url = this.base_url;
        var settings = {
            type : "POST",
            dataType: "json",
            success : function (data, status, xhr) {
                var name = data.name;
                w.location = utils.url_path_join(base_url, 'terminals', 
                    utils.encode_uri_components(name));
            },
            error : function(jqXHR, status, error){
                w.close();
                utils.log_ajax_error(jqXHR, status, error);
            },
        };
        var url = utils.url_path_join(
            this.base_url,
            'api/terminals'
        );
        utils.ajax(url, settings);
    };
    
    TerminalList.prototype.load_terminals = function() {
        var url = utils.url_path_join(this.base_url, 'api/terminals');
        utils.ajax(url, {
            type: "GET",
            cache: false,
            dataType: "json",
            success: $.proxy(this.terminals_loaded, this),
            error : utils.log_ajax_error
        });
    };

    TerminalList.prototype.terminals_loaded = function (data) {
        this.terminals = data;
        var selected_before = this.selected;
        this.clear_list();
        var item, term;
        for (var i=0; i < this.terminals.length; i++) {
            term = this.terminals[i];
            item = this.new_item(-1, true);
            this.add_link(term.name, item);
            this.add_shutdown_button(term.name, item);
        }

        selected_before.forEach(function(item) {
            var list_items = $('.list_item');
            for (var i=0; i<list_items.length; i++) {
                var $list_item = $(list_items[i]);
                if ($list_item.data('term-name') === item.term_name) {
                    $list_item.find('input[type=checkbox]').prop('checked', true);
                    break;
                }
            }
        });

        $('#terminal_list_placeholder').toggle(data.length === 0);
        this._selection_changed();
    };
    
    TerminalList.prototype.add_link = function(name, item) {
        item.data('term-name', name);
        item.find(".item_name").text("terminals/" + name);
        item.find(".item_icon").addClass("fa fa-terminal");
        var link = item.find("a.item_link")
            .attr('href', utils.url_path_join(this.base_url, "terminals",
                utils.encode_uri_components(name)));
        link.attr('target', IPython._target||'_blank');
        this.add_shutdown_button(name, item);
    };
    
    TerminalList.prototype.add_shutdown_button = function(name, item) {
        var that = this;
        var shutdown_button = $("<button/>").text(i18n._("Shutdown")).addClass("btn btn-xs btn-warning").
            click(function () {
                that.shutdown_terminal(name);
            });
        item.find(".item_buttons").text("").append(shutdown_button);
    };

    TerminalList.prototype.shutdown_selected = function() {
        var that = this;
        this.selected.forEach(function(item) {
            that.shutdown_terminal(item.term_name);
        });
        // Deselect items after successful shutdown.
        that.select('select-none');
    };

    TerminalList.prototype.shutdown_terminal = function(name) {
        var that = this;
        var settings = {
            processData : false,
            type : "DELETE",
            dataType : "json",
            success : function () {
                that.load_terminals();
            },
            error : utils.log_ajax_error,
        };
        var url = utils.url_path_join(that.base_url, 'api/terminals',
            utils.encode_uri_components(name));
        utils.ajax(url, settings);
        return false;
    };

    TerminalList.prototype._selection_changed = function () {
        var that = this;
        var selected = [];
        var total = $('#terminal_list').find('.list_item').length;
        var checked = $('#terminal_list').find('.list_item :checked').length;
        var has_terminal = (checked > 0);
        var has_running_notebook = $('#running_list').find('.list_item :checked').length;
        $('#terminal_list').find('.list_item :checked').each(function(index, item) {
            var parent = $(item).parent().parent();
            selected.push({
                term_name: parent.data('term-name')
            });
        })
        this.selected = selected;

        // Shutdown is only visible when one or more terminals or running notebooks
        // are selected and no non-notebook items are selected.
        if (has_terminal || has_running_notebook) {
            $('#' + that.element_name + '_toolbar').find('.shutdown-button').css('display', 'inline-block');
        } else {
            $('#' + that.element_name + '_toolbar').find('.shutdown-button').css('display', 'none');
        }

        // Duplicate, Delete, View and Edit aren't visible when a terminal is selected.
        if (has_running_notebook && !has_terminal) {
            $('#' + that.element_name + '_toolbar').find('.duplicate-button').css('display', 'inline-block');
            $('#' + that.element_name + '_toolbar').find('.delete-button').css('display', 'inline-block');
            $('#' + that.element_name + '_toolbar').find('.view-button').css('display', 'inline-block');
            $('#' + that.element_name + '_toolbar').find('.edit-button').css('display', 'inline-block');
        } else {
            $('#' + that.element_name + '_toolbar').find('.duplicate-button').css('display', 'none');
            $('#' + that.element_name + '_toolbar').find('.delete-button').css('display', 'none');
            $('#' + that.element_name + '_toolbar').find('.view-button').css('display', 'none');
            $('#' + that.element_name + '_toolbar').find('.edit-button').css('display', 'none');
        }

        var select_all = $(that.selector).find("#select-all");
        if (checked === 0) {
            select_all.prop('checked', false);
            select_all.prop('indeterminate', false);
            select_all.data('indeterminate', false);
        } else if (checked === total) {
            select_all.prop('checked', true);
            select_all.prop('indeterminate', false);
            select_all.data('indeterminate', false);
        } else {
            select_all.prop('checked', false);
            select_all.prop('indeterminate', true);
            select_all.data('indeterminate', true);
        }
        // Update total counter
        checked = bidi.applyBidi(checked);
        $(that.selector).find('#counter-select-all').html(checked===0 ? '&nbsp;' : checked);

        // If at aleast on item is selected, hide the selection instructions.
        if (checked > 0 || has_running_notebook) {
            $('.dynamic-instructions').hide();
        } else {
            $('.dynamic-instructions').show();
        }
    };

    return {TerminalList: TerminalList};
});
