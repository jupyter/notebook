// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// Give us an object to bind all events to. This object should be created
// before all other objects so it exists when others register event handlers.
// To register an event handler:
//
// require(['base/js/events'], function (events) {
//     events.on("event.Namespace", function () { do_stuff(); });
// });

define(['base/js/events', 'base/js/namespace'], function(events, Jupyter) {
    "use strict";

    // Promise to be resolved when the application is initialized.
    // The value is the name of the app on the current page.
    var app_initialized = new Promise(function(resolve, reject) {
        events.on('app_initialized.NotebookApp', function() {
            resolve('NotebookApp');
        });
        events.on('app_initialized.DashboardApp', function() {
            resolve('DashboardApp');
        });
    });

    var promises = {
        app_initialized: app_initialized
    };
    Jupyter.promises = promises;

    return promises;
});
