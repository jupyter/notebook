// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// Give us an object to bind all events to. This object should be created
// before all other objects so it exists when others register event handlers.
// To register an event handler:
//
// require(['base/js/events'], function (events) {
//     events.on("event.Namespace", function () { do_stuff(); });
// });
"use strict";

var Events = function () {};

var $events;
if (window && window.IPython && window.IPython.$events) {
    $events = window.IPython.$events;
} else if (global && global.IPython && global.IPython.$events) {
    $events = global.IPython.$events;
} else {
    var $ = require('jquery');
    $events = $([new Events()]);
}
var events = $events[0];

// Backwards compatability.
if (window && window.IPython) {
    window.IPython.events = events;
    window.IPython.$events = $events;
    window.IPython.Events = Events;
} else if (global && global.IPython) {
    global.IPython.events = events;
    global.IPython.$events = $events;
    global.IPython.Events = Events;
}

module.exports = $events;
