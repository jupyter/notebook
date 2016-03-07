// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// Give us an object to bind all events to. This object should be created
// before all other objects so it exists when others register event handlers.
// To register an event handler:
//
// require(['base/js/events'], function (events) {
//     events.on("event.Namespace", function () { do_stuff(); });
// });

define(['base/js/namespace'], function(Jupyter) {
    "use strict";
    
    // Events singleton
    if (!window._Events) {
        window._Events = function () {};
        window._events = new window._Events();
    }
    
    // Backwards compatability.
    Jupyter.Events = window._Events;
    Jupyter.events = window._events;
    
    return $([window._events]);
});
