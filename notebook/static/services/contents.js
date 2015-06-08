// AUTOMATICALY GENERATED FILE, see cooresponding .ts file
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
define(["require", "exports", 'jquery', 'base/js/utils'], function (require, exports, $, utils) {
    var DirectoryNotEmptyError = (function () {
        /** Constructor
         *
         * An error representing the result of attempting to delete a non-empty
         * directory.
         **/
        function DirectoryNotEmptyError() {
            this.name = "DirectoryNotEmptyError";
            this.message = 'A directory must be empty before being deleted.';
        }
        return DirectoryNotEmptyError;
    })();
    exports.DirectoryNotEmptyError = DirectoryNotEmptyError;
    ;
    // import already written interface from Jupyter-drive. 
    // and have jupyter-drive use the same. 
    var Contents = (function () {
        /**
         * Constructor
         *
         * A contents handles passing file operations
         * to the back-end.  This includes checkpointing
         * with the normal file operations.
         *
         * Parameters:
         *  options: dictionary
         *      Dictionary of keyword arguments.
         *          base_url: string
         */
        function Contents(options) {
            this.api_url = function () {
                var url_parts = [this._base_url, 'api/contents'].concat(Array.prototype.slice.apply(arguments));
                return utils.url_join_encode.apply(null, url_parts);
            };
            /**
             * Creates a basic error handler that wraps a jqXHR error as an Error.
             *
             * Takes a callback that accepts an Error, and returns a callback that can
             * be passed directly to $.ajax, which will wrap the error from jQuery
             * as an Error, and pass that to the original callback.
             *
             * @method create_basic_error_handler
             * @param{Function} callback
             * @return{Function}
             */
            this.create_basic_error_handler = function (callback) {
                if (!callback) {
                    return utils.log_ajax_error;
                }
                return function (xhr, status, error) {
                    callback(utils.wrap_ajax_error(xhr, status, error));
                };
            };
            /**
             * File Functions (including notebook operations)
             */
            /**
             * Get a file.
             *
             * @method get
             * @param {String} path
             * @param {Object} options
             *    type : 'notebook', 'file', or 'directory'
             *    format: 'text' or 'base64'; only relevant for type: 'file'
             *    content: true or false; // whether to include the content
             */
            this.get = function (path, options) {
                /**
                 * We do the call with settings so we can set cache to false.
                 */
                var settings = {
                    processData: false,
                    cache: false,
                    type: "GET",
                    dataType: "json",
                };
                var url = this.api_url(path);
                var params = {};
                if (options.type) {
                    params.type = options.type;
                }
                if (options.format) {
                    params.format = options.format;
                }
                if (options.content === false) {
                    params.content = '0';
                }
                return utils.promising_ajax(url + '?' + $.param(params), settings);
            };
            /**
             * Creates a new untitled file or directory in the specified directory path.
             *
             * @method new
             * @param {String} path: the directory in which to create the new file/directory
             * @param {Object} options:
             *      ext: file extension to use
             *      type: model type to create ('notebook', 'file', or 'directory')
             */
            this.new_untitled = function (path, options) {
                var data = JSON.stringify({
                    ext: options.ext,
                    type: options.type
                });
                var settings = {
                    processData: false,
                    type: "POST",
                    data: data,
                    contentType: 'application/json',
                    dataType: "json",
                };
                return utils.promising_ajax(this.api_url(path), settings);
            };
            this.delete = function (path) {
                var settings = {
                    processData: false,
                    type: "DELETE",
                    dataType: "json",
                };
                var url = this.api_url(path);
                return utils.promising_ajax(url, settings).catch(
                // Translate certain errors to more specific ones.
                function (error) {
                    // TODO: update IPEP27 to specify errors more precisely, so
                    // that error types can be detected here with certainty.
                    if (error.xhr.status === 400) {
                        throw new DirectoryNotEmptyError();
                    }
                    throw error;
                });
            };
            this.rename = function (path, new_path) {
                var data = { path: new_path };
                var settings = {
                    processData: false,
                    type: "PATCH",
                    data: JSON.stringify(data),
                    dataType: "json",
                    contentType: 'application/json',
                };
                var url = this.api_url(path);
                return utils.promising_ajax(url, settings);
            };
            this.save = function (path, model) {
                /**
                 * We do the call with settings so we can set cache to false.
                 */
                var settings = {
                    processData: false,
                    type: "PUT",
                    dataType: "json",
                    data: JSON.stringify(model),
                    contentType: 'application/json',
                };
                var url = this.api_url(path);
                return utils.promising_ajax(url, settings);
            };
            /**
             * Copy a file into a given directory via POST
             * The server will select the name of the copied file
             */
            this.copy = function (from_file, to_dir) {
                var url = this.api_url(to_dir);
                var settings = {
                    processData: false,
                    type: "POST",
                    data: JSON.stringify({ copy_from: from_file }),
                    contentType: 'application/json',
                    dataType: "json",
                };
                return utils.promising_ajax(url, settings);
            };
            /**
             * Checkpointing Functions
             */
            this.create_checkpoint = function (path) {
                var url = this.api_url(path, 'checkpoints');
                var settings = {
                    type: "POST",
                    contentType: false,
                    dataType: "json",
                };
                return utils.promising_ajax(url, settings);
            };
            this.list_checkpoints = function (path) {
                var url = this.api_url(path, 'checkpoints');
                var settings = {
                    type: "GET",
                    cache: false,
                    dataType: "json",
                };
                return utils.promising_ajax(url, settings);
            };
            this.restore_checkpoint = function (path, checkpoint_id) {
                var url = this.api_url(path, 'checkpoints', checkpoint_id);
                var settings = {
                    type: "POST",
                    contentType: false,
                };
                return utils.promising_ajax(url, settings);
            };
            this.delete_checkpoint = function (path, checkpoint_id) {
                var url = this.api_url(path, 'checkpoints', checkpoint_id);
                var settings = {
                    type: "DELETE",
                };
                return utils.promising_ajax(url, settings);
            };
            /**
             * File management functions
             */
            /**
             * List notebooks and directories at a given path
             *
             * On success, load_callback is called with an array of dictionaries
             * representing individual files or directories.  Each dictionary has
             * the keys:
             *     type: "notebook" or "directory"
             *     created: created date
             *     last_modified: last modified date
             * @method list_notebooks
             * @param {String} path The path to list notebooks in
             */
            this.list_contents = function (path) {
                return this.get(path, { type: 'directory' });
            };
            this._base_url = options.base_url;
        }
        return Contents;
    })();
    exports.Contents = Contents;
});

//# sourceMappingURL=../../../notebook/static/services/contents.js.map