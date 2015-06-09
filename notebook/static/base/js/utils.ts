// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.


/// <amd-dependency path="codemirror/mode/meta" name="CodeMirrorModeMeta"/>
/// <amd-dependency path="codemirror/lib/codemirror" name="CodeMirror"/>
import $ = require('jquery')
import moment = require('moment')


export interface MathJax {
    Hub
}

declare var MathJax:MathJax

var CodeMirror = require("codemirror/lib/codemirror");
var CodeMirrorModeMeta = require('codemirror/mode/meta')



interface MyWindow extends Window {
    MathJax?:MathJax
}

export interface MyError extends Error {
    xhr?
    xhr_status?
    xhr_error?
}


    /**
     * load one or more Jupyter notebook extensions with requirejs
     **/
    export var load_extensions = function (...exts):void {
        
        var extensions = [];
        var extension_names = exts;
        for (var i = 0; i < extension_names.length; i++) {
            extensions.push("nbextensions/" + exts[i]);
        }
        
        require(extensions,
            function () {
                for (var i = 0; i < exts.length; i++) {
                    var ext = exts[i];
                    var ext_name = extension_names[i];
                    // success callback
                    console.log("Loaded extension: " + ext_name);
                    if (ext && ext.load_ipython_extension !== undefined) {
                        ext.load_ipython_extension();
                    }
                }
            },
            function (err) {
                // failure callback
                console.log("Failed to load extension(s):", err.requireModules, err);
            }
        );
    };
    
    /**
     * Wait for a config section to load, and then load the extensions specified
     * in a 'load_extensions' key inside it.
     */
    export var load_extensions_from_config = function(section):void {
        section.loaded.then(function() {
            if (section.data.load_extensions) {
                var nbextension_paths = Object.getOwnPropertyNames(
                                            section.data.load_extensions);
                load_extensions.apply(this, nbextension_paths);
            }
        });
    }

    //============================================================================
    // Cross-browser RegEx Split
    //============================================================================

    // This code has been MODIFIED from the code licensed below to not replace the
    // default browser split.  The license is reproduced here.

    // see http://blog.stevenlevithan.com/archives/cross-browser-split for more info:
    /*!
     * Cross-Browser Split 1.1.1
     * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
     * Available under the MIT License
     * ECMAScript compliant, uniform cross-browser split method
     */

    /**
     * Splits a string into an array of strings using a regex or string
     * separator. Matches of the separator are not included in the result array.
     * However, if `separator` is a regex that contains capturing groups,
     * backreferences are spliced into the result each time `separator` is
     * matched. Fixes browser bugs compared to the native
     * `String.prototype.split` and can be used reliably cross-browser.
     * @param {String} str String to split.
     * @param {RegExp} separator Regex to use for separating
     *     the string.
     * @param {Number} [limit] Maximum number of items to include in the result
     *     array.
     * @returns {Array} Array of substrings.
     * @example
     *
     * // Basic use
     * regex_split('a b c d', ' ');
     * // -> ['a', 'b', 'c', 'd']
     *
     * // With limit
     * regex_split('a b c d', ' ', 2);
     * // -> ['a', 'b']
     *
     * // Backreferences in result array
     * regex_split('..word1 word2..', /([a-z]+)(\d+)/i);
     * // -> ['..', 'word', '1', ' ', 'word', '2', '..']
     */
    export var regex_split = function (str, separator, limit) {
        var output = [],
            flags = (separator.ignoreCase ? "i" : "") +
                    (separator.multiline  ? "m" : "") +
                    (separator.extended   ? "x" : "") + // Proposed for ES6
                    (separator.sticky     ? "y" : ""), // Firefox 3+
            lastLastIndex = 0,
            separator2, match, lastIndex, lastLength;
        // Make `global` and avoid `lastIndex` issues by working with a copy
        separator = new RegExp(separator.source, flags + "g");

        var compliantExecNpcg = typeof(/()??/.exec("")[1]) === "undefined";
        if (!compliantExecNpcg) {
            // Doesn't need flags gy, but they don't hurt
            separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
        }
        /* Values for `limit`, per the spec:
         * If undefined: 4294967295 // Math.pow(2, 32) - 1
         * If 0, Infinity, or NaN: 0
         * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
         * If negative number: 4294967296 - Math.floor(Math.abs(limit))
         * If other: Type-convert, then use the above rules
         */
        limit = typeof(limit) === "undefined" ?
            -1 >>> 0 : // Math.pow(2, 32) - 1
            limit >>> 0; // ToUint32(limit)
        for (match = separator.exec(str); match; match = separator.exec(str)) {
            // `separator.lastIndex` is not reliable cross-browser
            lastIndex = match.index + match[0].length;
            if (lastIndex > lastLastIndex) {
                output.push(str.slice(lastLastIndex, match.index));
                // Fix browsers whose `exec` methods don't consistently return `undefined` for
                // nonparticipating capturing groups
                if (!compliantExecNpcg && match.length > 1) {
                    match[0].replace(separator2, function () {
                        for (var i = 1; i < arguments.length - 2; i++) {
                            if (typeof(arguments[i]) === "undefined") {
                                match[i] = undefined;
                            }
                        }
                    });
                }
                if (match.length > 1 && match.index < str.length) {
                    Array.prototype.push.apply(output, match.slice(1));
                }
                lastLength = match[0].length;
                lastLastIndex = lastIndex;
                if (output.length >= limit) {
                    break;
                }
            }
            if (separator.lastIndex === match.index) {
                separator.lastIndex++; // Avoid an infinite loop
            }
        }
        if (lastLastIndex === str.length) {
            if (lastLength || !separator.test("")) {
                output.push("");
            }
        } else {
            output.push(str.slice(lastLastIndex));
        }
        return output.length > limit ? output.slice(0, limit) : output;
    };

    //============================================================================
    // End contributed Cross-browser RegEx Split
    //============================================================================


    export var uuid = function ():string {
        /**
         * http://www.ietf.org/rfc/rfc4122.txt
         */
        var s = [];
        var hexDigits = "0123456789ABCDEF";
        for (var i = 0; i < 32; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[12] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
        s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01

        var uuid = s.join("");
        return uuid;
    };


    //Fix raw text to parse correctly in crazy XML
    export var xmlencode = function(str:string):string {
        return str.replace(/\&/g,'&'+'amp;')
            .replace(/</g,'&'+'lt;')
            .replace(/>/g,'&'+'gt;')
            .replace(/\'/g,'&'+'apos;')
            .replace(/\"/g,'&'+'quot;')
            .replace(/`/g,'&'+'#96;');
    }


    //Map from terminal commands to CSS classes
    export var ansi_colormap = {
        "01":"ansibold",
        
        "30":"ansiblack",
        "31":"ansired",
        "32":"ansigreen",
        "33":"ansiyellow",
        "34":"ansiblue",
        "35":"ansipurple",
        "36":"ansicyan",
        "37":"ansigray",
        
        "40":"ansibgblack",
        "41":"ansibgred",
        "42":"ansibggreen",
        "43":"ansibgyellow",
        "44":"ansibgblue",
        "45":"ansibgpurple",
        "46":"ansibgcyan",
        "47":"ansibggray"
    };
    
    function _process_numbers(attrs, numbers:string[]) {
        // process ansi escapes
        var n = numbers.shift();
        if (ansi_colormap[n]) {
            if ( ! attrs["class"] ) {
                attrs["class"] = ansi_colormap[n];
            } else {
                attrs["class"] += " " + ansi_colormap[n];
            }
        } else if (n == "38" || n == "48") {
            // VT100 256 color or 24 bit RGB
            if (numbers.length < 2) {
                console.log("Not enough fields for VT100 color", numbers);
                return;
            }
            
            var index_or_rgb = numbers.shift();
            var r,g,b;
            if (index_or_rgb == "5") {
                // 256 color
                var idx = parseInt(numbers.shift(), 10);
                if (idx < 16) {
                    // indexed ANSI
                    // ignore bright / non-bright distinction
                    idx = idx % 8;
                    var ansiclass = ansi_colormap[n[0] + (idx % 8).toString()];
                    if ( ! attrs["class"] ) {
                        attrs["class"] = ansiclass;
                    } else {
                        attrs["class"] += " " + ansiclass;
                    }
                    return;
                } else if (idx < 232) {
                    // 216 color 6x6x6 RGB
                    idx = idx - 16;
                    b = idx % 6;
                    g = Math.floor(idx / 6) % 6;
                    r = Math.floor(idx / 36) % 6;
                    // convert to rgb
                    r = (r * 51);
                    g = (g * 51);
                    b = (b * 51);
                } else {
                    // grayscale
                    idx = idx - 231;
                    // it's 1-24 and should *not* include black or white,
                    // so a 26 point scale
                    r = g = b = Math.floor(idx * 256 / 26);
                }
            } else if (index_or_rgb == "2") {
                // Simple 24 bit RGB
                if (numbers.length > 3) {
                    console.log("Not enough fields for RGB", numbers);
                    return;
                }
                r = numbers.shift();
                g = numbers.shift();
                b = numbers.shift();
            } else {
                console.log("unrecognized control", numbers);
                return;
            }
            if (r !== undefined) {
                // apply the rgb color
                var line;
                if (n == "38") {
                    line = "color: ";
                } else {
                    line = "background-color: ";
                }
                line = line + "rgb(" + r + "," + g + "," + b + ");";
                if ( !attrs.style ) {
                    attrs.style = line;
                } else {
                    attrs.style += " " + line;
                }
            }
        }
    }

    export var ansispan = function(str:string):string {
        // ansispan function adapted from github.com/mmalecki/ansispan (MIT License)
        // regular ansi escapes (using the table above)
        var is_open = false;
        return str.replace(/\033\[(0?[01]|22|39)?([;\d]+)?m/g, function(match, prefix, pattern) {
            if (!pattern) {
                // [(01|22|39|)m close spans
                if (is_open) {
                    is_open = false;
                    return "</span>";
                } else {
                    return "";
                }
            } else {
                is_open = true;

                // consume sequence of color escapes
                var numbers = pattern.match(/\d+/g);
                var attrs = {};
                while (numbers.length > 0) {
                    _process_numbers(attrs, numbers);
                }

                var span = "<span ";
                Object.keys(attrs).map(function (attr) {
                    span = span + " " + attr + '="' + attrs[attr] + '"';
                });
                return span + ">";
            }
        });
    }

    // Transform ANSI color escape codes into HTML <span> tags with css
    // classes listed in the above ansi_colormap object. The actual color used
    // are set in the css file.
    export var fixConsole = function(txt:string):string {
        txt = xmlencode(txt);

        // Strip all ANSI codes that are not color related.  Matches
        // all ANSI codes that do not end with "m".
        var ignored_re = /(?=(\033\[[\d;=]*[a-ln-zA-Z]{1}))\1(?!m)/g;
        txt = txt.replace(ignored_re, "");
        
        // color ansi codes
        txt = ansispan(txt);
        return txt;
    }

    // Remove chunks that should be overridden by the effect of
    // carriage return characters
    export var fixCarriageReturn = function(txt) {
        var tmp = txt;
        do {
            txt = tmp;
            tmp = txt.replace(/\r+\n/gm, '\n'); // \r followed by \n --> newline
            tmp = tmp.replace(/^.*\r+/gm, '');  // Other \r --> clear line
        } while (tmp.length < txt.length);
        return txt;
    }

    // Locate any URLs and convert them to a anchor tag
    export var autoLinkUrls = function(txt:string):string {
        return txt.replace(/(^|\s)(https?|ftp)(:[^'">\s]+)/gi,
            "$1<a target=\"_blank\" href=\"$2$3\">$2$3</a>");
    }

    export var points_to_pixels = function (points:number):number {
        /**
         * A reasonably good way of converting between points and pixels.
         */
        var test = $('<div style="display: none; width: 10000pt; padding:0; border:0;"></div>');
        $('body').append(test);
        var pixel_per_point = test.width()/10000;
        test.remove();
        return Math.floor(points*pixel_per_point);
    };
    
    export var always_new = function (constructor) {
        /**
         * wrapper around contructor to avoid requiring `var a = new constructor()`
         * useful for passing constructors as callbacks,
         * not for programmer laziness.
         * from http://programmers.stackexchange.com/questions/118798
         */
        return function () {
            var obj = Object.create(constructor.prototype);
            constructor.apply(obj, arguments);
            return obj;
        };
    };

    export var url_path_join = function (...paths:string[]):string {
        /**
         * join a sequence of url components with '/'
         */
        var url = '';
        for (var i = 0; i < paths.length; i++) {
            if (paths[i] === '') {
                continue;
            }
            if (url.length > 0 && url[url.length-1] != '/') {
                url = url + '/' + paths[i];
            } else {
                url = url + paths[i];
            }
        }
        url = url.replace(/\/\/+/, '/');
        return url;
    };
    
    export var url_path_split = function (path:string):string[] {
        /**
         * Like os.path.split for URLs.
         * Always returns two strings, the directory path and the base filename
         */
        
        var idx = path.lastIndexOf('/');
        if (idx === -1) {
            return ['', path];
        } else {
            return [ path.slice(0, idx), path.slice(idx + 1) ];
        }
    };
    
    export var parse_url = function (url:string) {
        /**
         * an `a` element with an href allows attr-access to the parsed segments of a URL
         * a = parse_url("http://localhost:8888/path/name#hash")
         * a.protocol = "http:"
         * a.host     = "localhost:8888"
         * a.hostname = "localhost"
         * a.port     = 8888
         * a.pathname = "/path/name"
         * a.hash     = "#hash"
         */
        var a = document.createElement("a");
        a.href = url;
        return a;
    };
    
    export var encode_uri_components = function (uri:string):string {
        /**
         * encode just the components of a multi-segment uri,
         * leaving '/' separators
         */
        return uri.split('/').map(encodeURIComponent).join('/');
    };
    
    export var url_join_encode = function (...args):string {
        /**
         * join a sequence of url components with '/',
         * encoding each component with encodeURIComponent
         */
        return encode_uri_components(url_path_join.apply(null, args));
    };


    export var splitext = function (filename:string):string[] {
        /**
         * mimic Python os.path.splitext
         * Returns ['base', '.ext']
         */
        var idx = filename.lastIndexOf('.');
        if (idx > 0) {
            return [filename.slice(0, idx), filename.slice(idx)];
        } else {
            return [filename, ''];
        }
    };


    export var escape_html = function (text:string):string {
        /**
         * escape text to HTML
         */
        return $("<div/>").text(text).html();
    };


    export var get_body_data = function(key:string):string {
        /**
         * get a url-encoded item from body.data and decode it
         * we should never have any encoded URLs anywhere else in code
         * until we are building an actual request
         */
        var val = String($('body').data(key));
        if (!val)
            return val;
        return decodeURIComponent(val);
    };
    
    export var to_absolute_cursor_pos = function (cm, cursor):number {
        /**
         * get the absolute cursor position from CodeMirror's col, ch
         */
        if (!cursor) {
            cursor = cm.getCursor();
        }
        var cursor_pos = cursor.ch;
        for (var i = 0; i < cursor.line; i++) {
            cursor_pos += cm.getLine(i).length + 1;
        }
        return cursor_pos;
    };
    
    export var from_absolute_cursor_pos = function (cm, cursor_pos) {
        /**
         * turn absolute cursor position into CodeMirror col, ch cursor
         */
        var i, line, next_line;
        var offset = 0;
        for (i = 0, next_line=cm.getLine(i); next_line !== undefined; i++, next_line=cm.getLine(i)) {
            line = next_line;
            if (offset + next_line.length < cursor_pos) {
                offset += next_line.length + 1;
            } else {
                return {
                    line : i,
                    ch : cursor_pos - offset,
                };
            }
        }
        // reached end, return endpoint
        return {
            line : i - 1,
            ch : line.length - 1,
        };
    };
    
    // http://stackoverflow.com/questions/2400935/browser-detection-in-javascript
    export var browser:string[] = (function() {
        if (typeof navigator === 'undefined') {
            // navigator undefined in node
            return ['None'];
        }
        var N= navigator.appName, ua= navigator.userAgent, tem;
        var M= ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
        if (M && (tem= ua.match(/version\/([\.\d]+)/i)) !== null) M[2]= tem[1];
        M= M? [M[1], M[2]]: [N, navigator.appVersion,'-?'];
        return M;
    })();

    // http://stackoverflow.com/questions/11219582/how-to-detect-my-browser-version-and-operating-system-using-javascript
    export var platform:string = (function () {
        if (typeof navigator === 'undefined') {
            // navigator undefined in node
            return 'None';
        }
        var OSName="None";
        if (navigator.appVersion.indexOf("Win")!=-1) OSName="Windows";
        if (navigator.appVersion.indexOf("Mac")!=-1) OSName="MacOS";
        if (navigator.appVersion.indexOf("X11")!=-1) OSName="UNIX";
        if (navigator.appVersion.indexOf("Linux")!=-1) OSName="Linux";
        return OSName;
    })();
    
    export var get_url_param = function (name:string):string {
        // get a URL parameter. I cannot believe we actually need this.
        // Based on http://stackoverflow.com/a/25359264/938949
        var match = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
        if (match){
            return decodeURIComponent(match[1] || '');
        }
    };
    
    export var is_or_has = function (a, b):boolean {
        /**
         * Is b a child of a or a itself?
         */
        return a.has(b).length !==0 || a.is(b);
    };

    export var is_focused = function (e) {
        /**
         * Is element e, or one of its children focused?
         */
        e = $(e);
        var target = $(document.activeElement);
        if (target.length > 0) {
            if (is_or_has(e, target)) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    };
    
    export var mergeopt = function(_class, options, overwrite){
        options = options || {};
        overwrite = overwrite || {};
        return $.extend(true, {}, _class.options_default, options, overwrite);
    };
    
    export var ajax_error_msg = function (jqXHR) {
        /**
         * Return a JSON error message if there is one,
         * otherwise the basic HTTP status text.
         */
        if (jqXHR.responseJSON && jqXHR.responseJSON.traceback) {
            return jqXHR.responseJSON.traceback;
        } else if (jqXHR.responseJSON && jqXHR.responseJSON.message) {
            return jqXHR.responseJSON.message;
        } else {
            return jqXHR.statusText;
        }
    };
    
    export var log_ajax_error = function(jqXHR, status, error) {
        /**
         * log ajax failures with informative messages
         */
        var msg = "API request failed (" + jqXHR.status + "): ";
        console.log(jqXHR);
        msg += ajax_error_msg(jqXHR);
        console.log(msg);
    }

    export var requireCodeMirrorMode = function (mode, callback, errback) {
        /** 
         * find a predefined mode or detect from CM metadata then
         * require and callback with the resolveable mode string: mime or
         * custom name
         */

        var modename = (typeof mode == "string") ? mode :
            mode.mode || mode.name;

        // simplest, cheapest check by mode name: mode may also have config
        if (CodeMirror.modes.hasOwnProperty(modename)) {
            // return the full mode object, if it has a name
            callback(mode.name ? mode : modename);
            return;
        }

        // *somehow* get back a CM.modeInfo-like object that has .mode and
        // .mime
        var info = (mode && mode.mode && mode.mime && mode) ||
            CodeMirror.findModeByName(modename) ||
            CodeMirror.findModeByExtension(modename.split(".").slice(-1)) ||
            CodeMirror.findModeByMIME(modename) ||
            {mode: modename, mime: modename};

        require([
                // might want to use CodeMirror.modeURL here
                ['codemirror/mode', info.mode, info.mode].join('/'),
            ], function() {
              // return the original mode, as from a kernelspec on first load
              // or the mimetype, as for most highlighting
              callback(mode.name ? mode : info.mime);
            }, errback
        );
    };
    
    /** Error type for wrapped XHR errors. */
    export var XHR_ERROR = 'XhrError';
    
    /**
     * Wraps an AJAX error as an Error object.
     */
    export var wrap_ajax_error = function (jqXHR, status, error) {
        var wrapped_error = <MyError>(new Error(ajax_error_msg(jqXHR)));
        wrapped_error.name =  XHR_ERROR;
        // provide xhr response
        wrapped_error.xhr = jqXHR;
        wrapped_error.xhr_status = status;
        wrapped_error.xhr_error = error;
        return wrapped_error;
    };
    
    export var promising_ajax = function(url, settings) {
        /**
         * Like $.ajax, but returning an ES6 promise. success and error settings
         * will be ignored.
         */
        settings = settings || {};
        return new Promise(function(resolve, reject) {
            settings.success = function(data, status, jqXHR) {
                resolve(data);
            };
            settings.error = function(jqXHR, status, error) {
                log_ajax_error(jqXHR, status, error);
                reject(wrap_ajax_error(jqXHR, status, error));
            };
            $.ajax(url, settings);
        });
    };

    export var WrappedError = function(message, error){
        /**
         * Wrappable Error class
         *
         * The Error class doesn't actually act on `this`.  Instead it always
         * returns a new instance of Error.  Here we capture that instance so we
         * can apply it's properties to `this`.
         */
        var tmp = Error.apply(this, [message]);

        // Copy the properties of the error over to this.
        var properties = Object.getOwnPropertyNames(tmp);
        for (var i = 0; i < properties.length; i++) {
            this[properties[i]] = tmp[properties[i]];
        }

        // Keep a stack of the original error messages.
        if (error instanceof WrappedError) {
            this.error_stack = error.error_stack;
        } else {
            this.error_stack = [error];
        }
        this.error_stack.push(tmp);
    };

    WrappedError.prototype = Object.create(Error.prototype, {});


    export var load_class = function(class_name, module_name, registry) {
        /**
         * Tries to load a class
         *
         * Tries to load a class from a module using require.js, if a module 
         * is specified, otherwise tries to load a class from the global 
         * registry, if the global registry is provided.
         */
        return new Promise(function(resolve, reject) {

            // Try loading the view module using require.js
            if (module_name) {
                require([module_name], function(module) {
                    if (module[class_name] === undefined) {
                        reject(new Error('Class '+class_name+' not found in module '+module_name));
                    } else {
                        resolve(module[class_name]);
                    }
                }, reject);
            } else {
                if (registry && registry[class_name]) {
                    resolve(registry[class_name]);
                } else {
                    reject(new Error('Class '+class_name+' not found in registry '));
                }
            }
        });
    };

    export var resolve_promises_dict = function(d) {
        /**
         * Resolve a promiseful dictionary.
         * Returns a single Promise.
         */
        var keys = Object.keys(d);
        var values = [];
        keys.forEach(function(key) {
            values.push(d[key]);
        });
        return Promise.all(values).then(function(v) {
            d = {};
            for(var i=0; i<keys.length; i++) {
                d[keys[i]] = v[i];
            }
            return d;
        });
    };

    export var reject = function(message, log) {
        /**
         * Creates a wrappable Promise rejection function.
         * 
         * Creates a function that returns a Promise.reject with a new WrappedError
         * that has the provided message and wraps the original error that 
         * caused the promise to reject.
         */
        return function(error) { 
            var wrapped_error = new WrappedError(message, error);
            if (log) console.error(wrapped_error); 
            return Promise.reject(wrapped_error); 
        };
    };

    export var typeset = function(element, text) {
        /**
         * Apply MathJax rendering to an element, and optionally set its text
         *
         * If MathJax is not available, make no changes.
         *
         * Returns the output any number of typeset elements, or undefined if
         * MathJax was not available.
         *
         * Parameters
         * ----------
         * element: Node, NodeList, or jQuery selection
         * text: option string
         */
        var $el = element.jquery ? element : $(element);
        if(arguments.length > 1){
            $el.text(text);
        }
        if(!(<MyWindow>window).MathJax){
            return;
        }
        return $el.map(function(){
            // MathJax takes a DOM node: $.map makes `this` the context
            return (<MyWindow>window).MathJax.Hub.Queue(["Typeset", (<MyWindow>window).MathJax.Hub, this]);
        });
    };
    
    export var time:any = {};
    time.milliseconds = {};
    time.milliseconds.s = 1000;
    time.milliseconds.m = 60 * time.milliseconds.s;
    time.milliseconds.h = 60 * time.milliseconds.m;
    time.milliseconds.d = 24 * time.milliseconds.h;
    
    time.thresholds = {
        // moment.js thresholds in milliseconds
        s: (<number>moment.relativeTimeThreshold('s')) * time.milliseconds.s,
        m: (<number>moment.relativeTimeThreshold('m')) * time.milliseconds.m,
        h: (<number>moment.relativeTimeThreshold('h')) * time.milliseconds.h,
        d: (<number>moment.relativeTimeThreshold('d')) * time.milliseconds.d,
    };
    
    time.timeout_from_dt = function (dt) {
        /** compute a timeout based on dt
        
        input and output both in milliseconds
        
        use moment's relative time thresholds:
        
        - 10 seconds if in 'seconds ago' territory
        - 1 minute if in 'minutes ago'
        - 1 hour otherwise
        */
        if (dt < time.thresholds.s) {
            return 10 * time.milliseconds.s;
        } else if (dt < time.thresholds.m) {
            return time.milliseconds.m;
        } else {
            return time.milliseconds.h;
        }
    };
