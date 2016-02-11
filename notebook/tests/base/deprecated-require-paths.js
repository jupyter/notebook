/**
 * This module tests the deprecated requirejs module path based loading API
 */

// TODO: Remove these tests in notebook 6.0!

function guid() {
    return Math.random().toString(36).replace(/[^a-z]+/g, '');
}

casper.notebook_test(function () {
    var that = this;

    [
        'edit/js/savewidget',
        // 'edit/js/main',
        'edit/js/menubar',
        'edit/js/editor',
        'edit/js/notificationarea',
        'base/js/keyboard',
        'base/js/dialog',
        'base/js/notificationwidget',
        'base/js/namespace',
        'base/js/utils',
        'base/js/notificationarea',
        'base/js/events',
        'base/js/security',
        'base/js/page',
        'auth/js/main',
        'auth/js/logoutmain',
        'auth/js/loginmain',
        'auth/js/loginwidget',
        // 'terminal/js/main',
        'terminal/js/terminado',
        'notebook/js/toolbar',
        'notebook/js/savewidget',
        // 'notebook/js/main',
        'notebook/js/completer',
        'notebook/js/contexthint',
        'notebook/js/textcell',
        'notebook/js/cell',
        'notebook/js/tour',
        'notebook/js/menubar',
        'notebook/js/mathjaxutils',
        'notebook/js/codecell',
        'notebook/js/codemirror-ipython',
        'notebook/js/kernelselector',
        'notebook/js/codemirror-ipythongfm',
        'notebook/js/celltoolbarpresets/example',
        'notebook/js/celltoolbarpresets/default',
        'notebook/js/celltoolbarpresets/slideshow',
        'notebook/js/celltoolbarpresets/rawcell',
        'notebook/js/tooltip',
        'notebook/js/maintoolbar',
        'notebook/js/about',
        'notebook/js/notificationarea',
        'notebook/js/quickhelp',
        'notebook/js/actions',
        'notebook/js/pager',
        'notebook/js/searchandreplace',
        'notebook/js/keyboardmanager',
        'notebook/js/notebook',
        'notebook/js/scrollmanager',
        'notebook/js/outputarea',
        'notebook/js/celltoolbar',
        'notebook/js/commandpalette',
        'tree/js/sessionlist',
        // 'tree/js/main',
        'tree/js/kernellist',
        'tree/js/newnotebook',
        'tree/js/terminallist',
        'tree/js/notebooklist',
        'services/sessions/session',
        'services/contents',
        'services/kernels/serialize',
        'services/kernels/comm',
        'services/kernels/kernel',
        'services/config'
    ].forEach(function (name) {
        var guid = that.evaluate(function(name) {
            var guid = Math.random().toString(36).replace(/[^a-z]+/g, '');
            require(['notebook', name], function(notebookApp, module) {
                window[guid] = (notebookApp[name] === module);
            });
            return guid;
        }, {name: name});

        that.waitFor(function() {
            return this.evaluate(function(guid) {
                return window[guid] !== undefined;
            }, {guid: guid});
        });

        that.then(function() {
            this.test.assertEquals(this.evaluate(function(guid) {
                return window[guid];
            }, {guid: guid}), true, name + ' can be loaded directly with requirejs');
        });
    });
});
