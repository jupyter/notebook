
// Events that this code should rely on.
// delete.Cell
// selected_cell_type_changed.Notebook
// create.Cell

        this.widget_views = [];
        this._widgets_live = true;

        var widget_area = $('<div/>')
            .addClass('widget-area')
            .hide();
        this.widget_area = widget_area;
        var widget_prompt = $('<div/>')
            .addClass('prompt')
            .appendTo(widget_area);
        var widget_subarea = $('<div/>')
            .addClass('widget-subarea')
            .appendTo(widget_area);
        this.widget_subarea = widget_subarea;
        var that = this;
        var widget_clear_buton = $('<button />')
            .addClass('close')
            .html('&times;')
            .click(function() {
                widget_area.slideUp('', function(){ 
                    for (var i = 0; i < that.widget_views.length; i++) {
                        var view = that.widget_views[i];
                        view.remove();

                        // Remove widget live events.
                        view.off('comm:live', that._widget_live);
                        view.off('comm:dead', that._widget_dead);
                    }
                    that.widget_views = [];
                    widget_subarea.html(''); 
                });
            })
            .appendTo(widget_prompt);


    /**
    *  Display a widget view in the cell.
    */
    CodeCell.prototype.display_widget_view = function(view_promise) {

        // Display a dummy element
        var dummy = $('<div/>');
        this.widget_subarea.append(dummy);

        // Display the view.
        var that = this;
        return view_promise.then(function(view) {
            that.widget_area.show();
            dummy.replaceWith(view.$el);
            that.widget_views.push(view);

            // Check the live state of the view's model.
            if (view.model.comm_live) {
                that._widget_live(view);
            } else {
                that._widget_dead(view);
            }

            // Listen to comm live events for the view.
            view.on('comm:live', that._widget_live, that);
            view.on('comm:dead', that._widget_dead, that);
            return view;
        });
    };

    /**
     * Handles when a widget loses it's comm connection.
     * @param  {WidgetView} view
     */
    CodeCell.prototype._widget_dead = function(view) {
        if (this._widgets_live) {
            this._widgets_live = false;
            this.widget_area.addClass('connection-problems');
        }

    };

    /**
     * Handles when a widget is connected to a live comm.
     * @param  {WidgetView} view
     */
    CodeCell.prototype._widget_live = function(view) {
        if (!this._widgets_live) {
            // Check that the other widgets are live too.  O(N) operation.
            // Abort the function at the first dead widget found.
            for (var i = 0; i < this.widget_views.length; i++) {
                if (!this.widget_views[i].model.comm_live) return;
            }
            this._widgets_live = true;
            this.widget_area.removeClass('connection-problems');
        }
    };


// TODO: on event execute.CodeCell
        // Clear widget area
        for (var i = 0; i < this.widget_views.length; i++) {
            var view = this.widget_views[i];
            view.remove();

            // Remove widget live events.
            view.off('comm:live', this._widget_live);
            view.off('comm:dead', this._widget_dead);
        }
        this.widget_views = [];
        this.widget_subarea.html('');
        this.widget_subarea.height('');
        this.widget_area.height('');
        this.widget_area.hide();
        