// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// TODO: Remove me in 6.0!

define([], function() {
    console.warn(['Importing jquery and associated libraries, such as',
        'bootstrap, is deprecated.  This functionality will be remove in the',
        'notebook 6.0 in favor of a fully loaded jQuery global'].join(' '));
    return window.$;
});
