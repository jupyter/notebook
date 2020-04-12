// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'jquery',
    'base/js/utils',
    'base/js/events',
    'base/js/markdown',
], function ($, utils, events, markdown) {
    "use strict";
    
    var DirectoryReadme = function (selector, notebook_list) {
        /**
         * Constructor
         *
         * Parameters:
         *  selector: string
         *  notebook_list: NotebookList
         *      Used to obtain a file listing of the active directory.
         */
        this.selector = selector;
        this.element = $(selector);
        this.notebook_list = notebook_list;
        this.drawn_readme = null;

        this.init_readme();
        this.bind_events();
    };

    DirectoryReadme.prototype.find_readme = function() {
        /**
         * Find a readme in the current directory. Look for files with
         * a name like 'readme.md' (case insensitive) or similar and
         * mimetype 'text/markdown'.
         * 
         * @return null or { name, path, last_modified... }
         */
        var files_in_directory = this.notebook_list.model_list.content;
        for (var i = 0; i < files_in_directory.length; i++) {
            var file = files_in_directory[i];
            if(file.type === "file"
                    && file.name.toLowerCase().split(".")[0] === "readme"){
                return file;
            }
        }
        return null;
    }

    DirectoryReadme.prototype.needs_update = function(readme) {
        /**
         * Checks if readme is newer or different from the current drawn readme.
         * 
         * @private
         * @return if a redraw should happen
         */
        if(this.drawn_readme === readme) return false;
        if(this.drawn_readme === null || readme === null) return true;
        if(this.drawn_readme.path !== readme.path) return true;
        if(this.draw_readme.last_modified < readme.last_modified) return true;
        return false;
    }


    DirectoryReadme.prototype.fetch_readme = function() {
        /**
         * Find and fetch a readme file, and if necessary trigger a redraw.
         */
        var readme = this.find_readme();

        if(this.needs_update(readme)) {
            if(readme === null) {
                this.clear_readme();
            } else {
                var that = this;
                this.notebook_list.contents.get(readme.path, {type: 'file'}).then(
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
        /**
         * When the notebook_list fires a draw_notebook event, fetch the readme. 
         */
        events.on("draw_notebook_list.NotebookList", $.proxy(this.fetch_readme, this));
    }
    
    DirectoryReadme.prototype.init_readme = function() {
        /**
         * Build the DOM.
         */
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
        /**
         * If no readme is found, hide.
         */
        this.drawn_readme = null;
        this.element.hide();
    }
    
    DirectoryReadme.prototype.draw_readme = function (file) {
        /**
         * Draw the given readme file. This function is used by fetch_readme.
         * 
         * @param file: {name, path, content}
         */
        this.drawn_readme = file;
        this.element.show();
        this.title
        .attr("href", 
            utils.url_path_join(
                this.notebook_list.base_url,
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
