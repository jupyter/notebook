
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
            return $('.cell.jupyter-soft-selected').length; 
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

    });
});
