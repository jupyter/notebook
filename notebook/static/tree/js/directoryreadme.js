// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'jquery',
    'base/js/utils',
    'base/js/events',
    'base/js/markdown',
    'base/js/mathjaxutils',
], function ($, utils, events, markdown, mathjaxutils) {
    "use strict";
    
    var DirectoryReadme = function (selector, notebook_list, options) {
        this.selector = selector;
        this.element = $(selector);
        this.notebook_list = notebook_list;
        this.base_url = options.base_url || utils.get_body_data("baseUrl");
        this.contents = options.contents;
        this.drawn_readme = null;

        this.init_readme();
        this.bind_events();
    };

    DirectoryReadme.prototype.find_readme = function() {
        var files_in_directory = this.notebook_list.model_list.content;
        for (var i = 0; i < files_in_directory.length; i++) {
            var file = files_in_directory[i];
            if(file.type === "file"
                    && file.mimetype === "text/markdown"
                    && file.name.toLowerCase().split(".")[0] === "readme"){
                return file;
            }
        }
        return null;
    }

    DirectoryReadme.prototype.needs_update = function(readme) {
        if(this.drawn_readme === readme) return false;
        if(this.drawn_readme === null || readme === null) return true;
        if(this.drawn_readme.path !== readme.path) return true;
        if(this.draw_readme.last_modified < readme.last_modified) return true;
        return false;
    }


    DirectoryReadme.prototype.fetch_readme = function() {
        var readme = this.find_readme();

        if(this.needs_update(readme)) {
            if(readme === null) {
                this.clear_readme();
            } else {
                var that = this;
                this.contents.get(readme.path, {type: 'file'}).then(
                    function(file) {
                        that.draw_readme(file);
                    },
                    function() {
                        that.clear_readme();
                    }
                );
            }
        }
    }

    DirectoryReadme.prototype.bind_events = function () {
        events.on("draw_notebook_list.NotebookList", $.proxy(this.fetch_readme, this));
    }
    
    DirectoryReadme.prototype.init_readme = function() {
        var element = this.element;
        element.hide().addClass("list_container");

        this.title = $("<a />");
        $("<div/>")
        .addClass("list_header row readme_header")
        .html([
            $('<i/>')
            .addClass('item_icon file_icon'),
            this.title
        ]).appendTo(element);


        this.page = $("<div/>")
        .addClass("readme_content")
        .appendTo(element);
    } 

    DirectoryReadme.prototype.clear_readme = function () {
        this.drawn_readme = null;
        this.element.hide();
    }
    
    DirectoryReadme.prototype.draw_readme = function (file) {
        this.drawn_readme = file;
        this.element.show();
        this.title
        .attr("href", 
            utils.url_path_join(
                this.base_url,
                "edit",
                utils.encode_uri_components(file.path)
            ))
        .text(file.name);

        var page = this.page;
        markdown.render(file.content, {
            with_math: true,
            sanitize: true
        }, function(err, html) {
            page.html(html);
            utils.typeset(page);
        });
    };
    
    return {'DirectoryReadme': DirectoryReadme};
});
