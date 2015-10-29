
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
            return Jupyter.notebook.get_marked_cells().length; 
        }), 1, 'only one cell is marked programmatically');

        this.test.assertEquals(this.evaluate(function() {
            return Jupyter.notebook.get_marked_indices()[0];
        }), selectedIndex, 'marked cell is selected cell');

        this.test.assertEquals(this.evaluate(function() { 
            return $('.cell.marked').length; 
        }), 0, 'no cells are marked visibily');
        
        this.evaluate(function() {
            Jupyter.notebook.mark_all_cells();
        });
        
        var cellCount = this.evaluate(function() { 
            return Jupyter.notebook.ncells(); 
        });
        
        this.test.assertEquals(this.evaluate(function() { 
            return Jupyter.notebook.get_marked_cells().length; 
        }), cellCount, 'mark_all');
        
        this.test.assertEquals(this.evaluate(function() { 
            return $('.cell.marked').length; 
        }), cellCount, 'marked cells are marked visibily');
        
        this.evaluate(function() {
            Jupyter.notebook.unmark_all_cells();
        });
        
        this.test.assertEquals(this.evaluate(function() { 
            return Jupyter.notebook.get_marked_cells().length; 
        }), 1, 'unmark_all');

        this.test.assertEquals(this.evaluate(function() {
            return Jupyter.notebook.get_marked_indices()[0];
        }), selectedIndex, 'marked cell is selected cell');

        this.evaluate(function() {
            Jupyter.notebook.set_marked_indices([1]);
        });

        this.test.assertEquals(this.evaluate(function() {
            return Jupyter.notebook.get_marked_cells().length;
        }), 2, 'two cells are marked');

        this.test.assertEquals(this.evaluate(function() {
            return Jupyter.notebook.get_marked_indices();
        }), [selectedIndex, 1], 'get/set_marked_indices');
    });
});
