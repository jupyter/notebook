// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'widgets/js/init'
], function(widgetmanager) {
    "use strict";
    
    // TODO
    this.widget_manager = new widgetmanager.WidgetManager(this.comm_manager, notebook);
});
