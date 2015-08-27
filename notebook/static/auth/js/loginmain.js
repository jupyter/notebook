// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define(['base/js/namespace', 'base/js/page'], function(IPython, page) {
    function login_main() {
      var page_instance = new page.Page();
      $('button#login_submit').addClass("btn btn-default");
      page_instance.show();
      $('input#password_input').focus();
    
      IPython.page = page_instance;
    }
    return login_main;
});
