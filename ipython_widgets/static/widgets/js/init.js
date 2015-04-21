// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    "nbextensions/widgets/widgets/js/manager",
    "nbextensions/widgets/widgets/js/widget",
    "nbextensions/widgets/widgets/js/widget_link",
    "nbextensions/widgets/widgets/js/widget_bool",
    "nbextensions/widgets/widgets/js/widget_button",
    "nbextensions/widgets/widgets/js/widget_box",
    "nbextensions/widgets/widgets/js/widget_float",
    "nbextensions/widgets/widgets/js/widget_image",
    "nbextensions/widgets/widgets/js/widget_int",
    "nbextensions/widgets/widgets/js/widget_output",
    "nbextensions/widgets/widgets/js/widget_selection",
    "nbextensions/widgets/widgets/js/widget_selectioncontainer",
    "nbextensions/widgets/widgets/js/widget_string",
], function(widgetmanager, widget) {
    // Register all of the loaded models and views with the widget manager.
    for (var i = 2; i < arguments.length; i++) {
        var module = arguments[i];
        for (var target_name in module) {
            if (module.hasOwnProperty(target_name)) {
                var target = module[target_name];
                if (target.prototype instanceof widget.WidgetModel) {
                    widgetmanager.WidgetManager.register_widget_model(target_name, target);
                } else if (target.prototype instanceof widget.WidgetView) {
                    widgetmanager.WidgetManager.register_widget_view(target_name, target);
                }
            }
        }
    }
    return {'WidgetManager': widgetmanager.WidgetManager}; 
});
