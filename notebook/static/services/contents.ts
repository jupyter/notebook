// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

export interface CheckpointId extends Object {}

/**
 * A path to a specific folder, file or notebook. 
 **/
export interface Path extends String {}

export interface Model extends Object {}


interface Url extends String {}


import $ = require('jquery');
import utils = require('base/js/utils');

export class DirectoryNotEmptyError implements Error {
    "use strict";
    public name:string
    public message:string

    /** Constructor
     *
     * An error representing the result of attempting to delete a non-empty
     * directory.
     **/
    constructor() {
        this.name = "DirectoryNotEmptyError"
        this.message = 'A directory must be empty before being deleted.';
    }
};

export interface Opt {
    type?:string
    format?:string
    content?
    ext?:string
}

// import already written interface from Jupyter-drive. 
// and have jupyter-drive use the same. 
export class Contents {
    "use strict";
    
    private _base_url:Url

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
    constructor(options) {
        this._base_url = options.base_url;
    }

    private api_url = function():Url {
        var url_parts = [this._base_url, 'api/contents'].concat(
                                Array.prototype.slice.apply(arguments));
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
    private create_basic_error_handler = function(callback:(any)=>void):(xhr, status, error)=>void {
        if (!callback) {
            return utils.log_ajax_error;
        }
        return function(xhr, status, error) {
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
    public get = function (path:Path, options:Opt):Promise<any> {
        /**
         * We do the call with settings so we can set cache to false.
         */
        var settings = {
            processData : false,
            cache : false,
            type : "GET",
            dataType : "json",
        };
        var url:Url = this.api_url(path);
        var params:Opt = {};
        if (options.type) { params.type = options.type; }
        if (options.format) { params.format = options.format; }
        if (options.content === false) { params.content = '0'; }
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
    public new_untitled = function(path:Path, options:Opt):Promise<any> {
        var data = JSON.stringify({
          ext: options.ext,
          type: options.type
        });

        var settings = {
            processData : false,
            type : "POST",
            data: data,
            contentType: 'application/json',
            dataType : "json",
        };
        return utils.promising_ajax(this.api_url(path), settings);
    };

    public delete = function(path:Path):Promise<any> {
        var settings = {
            processData : false,
            type : "DELETE",
            dataType : "json",
        };
        var url = this.api_url(path);
        return utils.promising_ajax(url, settings).catch(
            // Translate certain errors to more specific ones.
            function(error) {
                // TODO: update IPEP27 to specify errors more precisely, so
                // that error types can be detected here with certainty.
                if (error.xhr.status === 400) {
                    throw new DirectoryNotEmptyError();
                }
                throw error;
            }
        );
    };

    public rename = function(path:Path, new_path:Path):Promise<any> {
        var data = {path: new_path};
        var settings = {
            processData : false,
            type : "PATCH",
            data : JSON.stringify(data),
            dataType: "json",
            contentType: 'application/json',
        };
        var url = this.api_url(path);
        return utils.promising_ajax(url, settings);
    };

    public save = function(path:Path, model:Model):Promise<any> {
        /**
         * We do the call with settings so we can set cache to false.
         */
        var settings = {
            processData : false,
            type : "PUT",
            dataType: "json",
            data : JSON.stringify(model),
            contentType: 'application/json',
        };
        var url = this.api_url(path);
        return utils.promising_ajax(url, settings);
    };
    
    /**
     * Copy a file into a given directory via POST
     * The server will select the name of the copied file
     */
    public copy = function(from_file:Path, to_dir:Path):Promise<any> {
        var url = this.api_url(to_dir);
        
        var settings = {
            processData : false,
            type: "POST",
            data: JSON.stringify({copy_from: from_file}),
            contentType: 'application/json',
            dataType : "json",
        };
        return utils.promising_ajax(url, settings);
    };

    /**
     * Checkpointing Functions
     */

    public create_checkpoint = function(path:Path):Promise<any> {
        var url = this.api_url(path, 'checkpoints');
        var settings = {
            type : "POST",
            contentType: false,  // no data
            dataType : "json",
        };
        return utils.promising_ajax(url, settings);
    };

    public list_checkpoints = function(path:Path):Promise<any> {
        var url = this.api_url(path, 'checkpoints');
        var settings = {
            type : "GET",
            cache: false,
            dataType: "json",
        };
        return utils.promising_ajax(url, settings);
    };

    public restore_checkpoint = function(path:Path, checkpoint_id:CheckpointId):Promise<any> {
        var url = this.api_url(path, 'checkpoints', checkpoint_id);
        var settings = {
            type : "POST",
            contentType: false,  // no data
        };
        return utils.promising_ajax(url, settings);
    };

    public delete_checkpoint = function(path:Path, checkpoint_id:CheckpointId):Promise<any> {
        var url = this.api_url(path, 'checkpoints', checkpoint_id);
        var settings = {
            type : "DELETE",
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
    public list_contents = function(path:Path):Promise<any> {
        return this.get(path, {type: 'directory'});
    };

}
