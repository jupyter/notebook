// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// TODO: Remove me in 6.0!

define([], function() {
    console.warn(['Importing typeahead is deprecated because it is associated',
        'with a global jquery variable.  This feature will be removed in the',
        'notebook 6.0 in favor of a jquery global.  Alternatively use',
        'typeahead via `$.typeahead.`'].join(' '));
    return $.typeahead;
});
