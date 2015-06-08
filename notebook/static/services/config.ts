// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.


import $ = require('jquery');
import utils = require('base/js/utils');

"use strict";

export class ConfigSection {

    section_name:string
    base_url:string
    data:any
    loaded:Promise<any>
    private _one_load_finished:boolean
    private _finish_firstload:()=>any

    constructor(section_name:string, options) {
        this.section_name = section_name;
        this.base_url = options.base_url;
        this.data = {};
        
        var that = this;
        
        /* .loaded is a promise, fulfilled the first time the config is loaded
         * from the server. Code can do:
         *      conf.loaded.then(function() { ... using conf.data ... });
         */
        this._one_load_finished = false;
        this.loaded = new Promise(function(resolve, reject) {
            that._finish_firstload = resolve;
        });
    }

    public api_url():string {
        return utils.url_join_encode(this.base_url, 'api/config', this.section_name);
    }
    
    private _load_done():void {
        if (!this._one_load_finished) {
            this._one_load_finished = true;
            this._finish_firstload();
        }
    }
    
    public load():Promise<any> {
        var that = this;
        return utils.promising_ajax(this.api_url(), {
            cache: false,
            type: "GET",
            dataType: "json",
        }).then(function(data) {
            that.data = data;
            that._load_done();
            return data;
        });
    }
    
    /**
     * Modify the config values stored. Update the local data immediately,
     * send the change to the server, and use the updated data from the server
     * when the reply comes.
     */
    public update(newdata) {
        $.extend(true, this.data, newdata);  // true -> recursive update
        
        var that = this;
        return utils.promising_ajax(this.api_url(), {
            processData: false,
            type : "PATCH",
            data: JSON.stringify(newdata),
            dataType : "json",
            contentType: 'application/json',
        }).then(function(data) {
            that.data = data;
            that._load_done();
            return data;
        });
    }

}

export class ConfigWithDefaults {

    section
    defaults
    classname
    
    constructor(section, defaults, classname) {
        this.section = section;
        this.defaults = defaults;
        this.classname = classname;
    }
    
    private _class_data() {
        if (this.classname) {
            return this.section.data[this.classname] || {};
        } else {
            return this.section.data
        }
    }
    
    /**
     * Wait for config to have loaded, then get a value or the default.
     * Returns a promise.
     */
    public get(key:string) {
        var that = this;
        return this.section.loaded.then(function() {
            return this._class_data()[key] || this.defaults[key]
        });
    }
    
    /**
     * Return a config value. If config is not yet loaded, return the default
     * instead of waiting for it to load.
     */
    public get_sync(key:string) {
        return this._class_data()[key] || this.defaults[key];
    }
    
    /**
     * Set a config value. Send the update to the server, and change our
     * local copy of the data immediately.
     * Returns a promise which is fulfilled when the server replies to the
     * change.
     */
    public set(key:string, value) {
         var d = {};
         d[key] = value;
         if (this.classname) {
            var d2 = {};
            d2[this.classname] = d;
            return this.section.update(d2);
        } else {
            return this.section.update(d);
        }
    }
    

}
