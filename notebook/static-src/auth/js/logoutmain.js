// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

    var IPython = require('base/js/namespace');
    var page = require('base/js/page');

    module.exports = function logoutMain() {
        var page_instance = new page.Page();
        page_instance.show();

        IPython.page = page_instance;
    };
