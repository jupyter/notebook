
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
        var selectedIndex = this.evaluate(function () {
            Jupyter.notebook.select(0);
            return Jupyter.notebook.get_selected_index();
        });

        this.test.assertEquals(this.evaluate(function() { 
            return Jupyter.notebook.get_selected_cells().length; 
        }), 1, 'only one cell is selected programmatically');

        this.test.assertEquals(this.evaluate(function() {
            return $('.cell.jupyter-soft-selected, .cell.selected').length;
        }), 1, 'one cell is selected');

        this.test.assertEquals(this.evaluate(function() { 
            Jupyter.notebook.extend_selection_by(1);
            return Jupyter.notebook.get_selected_cells().length; 
        }), 2, 'extend selection by one');

        
        this.test.assertEquals(this.evaluate(function() { 
            Jupyter.notebook.extend_selection_by(-1);
            return Jupyter.notebook.get_selected_cells().length; 
        }), 1, 'contract selection by one');
        
        this.test.assertEquals(this.evaluate(function() { 
            Jupyter.notebook.select(1);
            Jupyter.notebook.extend_selection_by(-1);
            return Jupyter.notebook.get_selected_cells().length; 
        }), 2, 'extend selection by one up');

        // Test multiple markdown conversions.
        var cell_types = this.evaluate(function() {
            Jupyter.notebook.select(0);
            Jupyter.notebook.extend_selection_by(2);
            var indices = Jupyter.notebook.get_selected_cells_indices();
            Jupyter.notebook.cells_to_markdown();
            return indices.map(function(i) {
                return Jupyter.notebook.get_cell(i).cell_type;
            });
        });
        this.test.assert(cell_types.every(function(cell_type) {
            return cell_type === 'markdown';
        }), 'selected cells converted to markdown');

        this.test.assertEquals(this.evaluate(function() {
            return Jupyter.notebook.get_selected_cells_indices();
        }).length, 1, 'one cell selected after convert');

        // Test multiple raw conversions.
        cell_types = this.evaluate(function() {
            Jupyter.notebook.select(0);
            Jupyter.notebook.extend_selection_by(2);
            var indices = Jupyter.notebook.get_selected_cells_indices();
            Jupyter.notebook.cells_to_raw();
            return indices.map(function(i) {
                return Jupyter.notebook.get_cell(i).cell_type;
            });
        });
        this.test.assert(cell_types.every(function(cell_type) {
            return cell_type === 'raw';
        }), 'selected cells converted to raw');

        this.test.assertEquals(this.evaluate(function() {
            return Jupyter.notebook.get_selected_cells_indices();
        }).length, 1, 'one cell selected after convert');

        // Test multiple code conversions.
        cell_types = this.evaluate(function() {
            Jupyter.notebook.select(0);
            Jupyter.notebook.extend_selection_by(2);
            var indices = Jupyter.notebook.get_selected_cells_indices();
            Jupyter.notebook.cells_to_code();
            return indices.map(function(i) {
                return Jupyter.notebook.get_cell(i).cell_type;
            });
        });
        this.test.assert(cell_types.every(function(cell_type) {
            return cell_type === 'code';
        }), 'selected cells converted to code');

        this.test.assertEquals(this.evaluate(function() {
            return Jupyter.notebook.get_selected_cells_indices();
        }).length, 1, 'one cell selected after convert');
    });
});
