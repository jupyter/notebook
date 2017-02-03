// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'notebook/js/celltoolbar',
    'base/js/utils'
], function(celltoolbar, utils) {
    "use strict";

    var _ = function(text) {
      	return utils.i18n.gettext(text);
      }    

    var CellToolbar = celltoolbar.CellToolbar;
    var slideshow_preset = [];

    var select_type = CellToolbar.utils.select_ui_generator([
            ["-"            ,"-"            ],
            [_("Slide")        ,"slide"        ],
            [_("Sub-Slide")    ,"subslide"     ],
            [_("Fragment")     ,"fragment"     ],
            [_("Skip")         ,"skip"         ],
            [_("Notes")        ,"notes"        ],
            ],
            // setter
            function(cell, value){
                // we check that the slideshow namespace exist and create it if needed
                if (cell.metadata.slideshow === undefined){cell.metadata.slideshow = {};}
                // set the value
                cell.metadata.slideshow.slide_type = value;
                },
            //geter
            function(cell){ var ns = cell.metadata.slideshow;
                // if the slideshow namespace does not exist return `undefined`
                // (will be interpreted as `false` by checkbox) otherwise
                // return the value
                return (ns === undefined)? undefined: ns.slide_type;
                },
            _("Slide Type"));

    var register = function (notebook) {
        CellToolbar.register_callback('slideshow.select',select_type);
        slideshow_preset.push('slideshow.select');

        CellToolbar.register_preset(_('Slideshow'),slideshow_preset, notebook);
    };
    return {'register': register};
});
