// Test
casper.notebook_test(function () {
    var that = this;
    
    var a = 'print("a")';
    var index = this.append_cell(a);

    var b = 'print("b")';
    index = this.append_cell(b);

    var c = 'print("c")';
    index = this.append_cell(c);

    this.then(function () {   
        /**
         * Test that cells, which start off not collapsed, are collapsed after
         * calling the multiselected cell toggle.
         */     
        var cell_output_states = this.evaluate(function() {
            Jupyter.notebook.select(0);
            Jupyter.notebook.extend_selection_by(2);
            var indices = Jupyter.notebook.get_selected_cells_indices();
            Jupyter.notebook.toggle_cells_outputs();
            return indices.map(function(index) {
                return Jupyter.notebook.get_cell(index).collapsed;
            });
        });

        this.test.assert(cell_output_states.every(function(cell_output_state) {
            return cell_output_state == false;
        }), "ensure that all cells are not collapsed");
        
        /**
         * Test that cells, which start off not scrolled are scrolled after
         * calling the multiselected scroll toggle.
         */
        var cell_scrolled_states = this.evaluate(function() {
            Jupyter.notebook.select(0);
            Jupyter.notebook.extend_selection_by(2);
            var indices = Jupyter.notebook.get_selected_cells_indices();
            Jupyter.notebook.toggle_cells_outputs_scroll();
            return indices.map(function(index) {
                return Jupyter.notebook.get_cell(index).output_area.scroll_state;
            });
        });

        this.test.assert(cell_scrolled_states.every(function(cell_scroll_state) {
            return cell_scroll_state;
        }), "ensure that all have scrolling enabled");

        /**
         * Test that cells, which start off not cleared are cleared after
         * calling the multiselected scroll toggle.
         */
        var cell_outputs_cleared = this.evaluate(function() {
            Jupyter.notebook.select(0);
            Jupyter.notebook.extend_selection_by(2);
            var indices = Jupyter.notebook.get_selected_cells_indices();
            Jupyter.notebook.clear_cells_outputs();
            return indices.map(function(index) {
                return Jupyter.notebook.get_cell(index).output_area.element.html();
            });
        });

        this.test.assert(cell_outputs_cleared.every(function(cell_output_state) {
            return cell_output_state == "";
        }), "ensure that all cells are cleared");

    });
});
