// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'nbextensions/widgets/widgets/js/init',
    'nbextensions/widgets/notebook/js/widgetarea',
    'base/js/events'
], function(widgetmanager, widgetarea, events) {
    "use strict";

    /**
     * Create a widget manager for a kernel instance.
     */
    var handle_kernel = function(kernel) {
        if (kernel.comm_manager && kernel.widget_manager === undefined) {
            
            // Create a widget manager instance.  Use the global
            // IPython.notebook handle.
            var manager = new widgetmanager.WidgetManager(kernel.comm_manager, IPython.notebook);

            // Store a handle to the manager so we know not to
            // another for this kernel.  This also is a convinience
            // for the user.
            kernel.widget_manager = manager;
        }
    };

    // If a kernel already exists, create a widget manager.
    if (IPython.notebook && IPython.notebook.kernel) {
        handle_kernel(IPython.notebook.kernel);
    }
    // When the kernel is created, create a widget manager.
    events.on('kernel_created.Kernel kernel_created.Session', function(event, data) {
        handle_kernel(data.kernel);
    });

    /**
     * Creates a widgetarea for the cell if it is a CodeCell.
     * If the cell isn't a CodeCell, no action is taken.
     */
    var handle_cell = function(cell) {
        if (cell.cell_type==='code') {
            var area = new widgetarea.WidgetArea(cell);
            cell.widgetarea = area;
        }
    };

    // Create widget areas for cells that already exist.
    var cells = IPython.notebook.get_cells();
    for (var i = 0; i < cells.length; i++) {
        handle_cell(cells[i]);
    }
    
    // Listen to cell creation and deletion events.  When a
    // cell is created, create a widget area for that cell.
    events.on('create.Cell', function(event, data) {
        handle_cell(data.cell);
    });
    // When a cell is deleted, delete the widget area if it
    // exists.
    events.on('delete.Cell', function(event, data) {
        if (data.cell && data.cell.widgetarea) {
            data.cell.widgetarea.dispose();
        }
    });
});
