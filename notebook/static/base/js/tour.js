// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// TODO: Remove me in 6.0!

define([], function() {
    console.warn(['Importing bootstrap tour is deprecated.  This feature will',
        'be remove in the notebook 6.0 in favor of the Tour global object.'].join(' '));
    return window.Tour;
});
