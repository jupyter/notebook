// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
__webpack_public_path__ = window['staticURL'] + 'auth/js/built/';

define(['./loginmain', './logoutmain'], function (login_main, logout_main) {
    return {
        login_main: login_main,
        logout_main: logout_main
    };
});
