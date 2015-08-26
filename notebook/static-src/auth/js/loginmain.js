// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

    var IPython = require('base/js/namespace');
    var page = require('base/js/page');

    module.exports = function loginMain() {
        var page_instance = new page.Page();
        $('button#login_submit').addClass("btn btn-default");
        page_instance.show();
        $('input#password_input').focus();

        IPython.page = page_instance;
    };
