
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
        this.test.assertEquals(this.evaluate(function() { 
            return Jupyter.notebook.get_marked_cells().length; 
        }), 0, 'no cells are marked programmatically');
        
        this.test.assertEquals(this.evaluate(function() { 
            return $('.cell.marked').length; 
        }), 0, 'no cells are marked visibily');
        
        this.evaluate(function() {
            Jupyter.notebook.mark_all();
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
            Jupyter.notebook.unmark_all();
        });
        
        this.test.assertEquals(this.evaluate(function() { 
            return Jupyter.notebook.get_marked_cells().length; 
        }), 0, 'unmark_all');
        
        this.evaluate(function() {
            Jupyter.notebook.set_marked_indices([1]);
        });
        
        this.test.assertEquals(this.evaluate(function() { 
            return Jupyter.notebook.get_marked_indices()[0];
        }), 1, 'get/set_marked_indices');
    });
});
