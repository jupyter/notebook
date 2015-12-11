

// Test
casper.notebook_test(function () {
    this.append_cell('1');
    this.append_cell('2');
    this.append_cell('3');
    this.append_cell('4');
    this.append_cell('5');
    this.append_cell('6');

    function assert_order(that, pre_message, expected_state){

        for (var i=1; i<expected_state.length; i++){
            that.test.assertEquals(that.get_cell_text(i), expected_state[i],
                    pre_message+': Verify that cell `' + i +  '` has for content: `'+ expected_state[i] + '` found : ' + that.get_cell_text(i)
            );
        }
    }



    this.then(function () {
        // select 3 first cells
        this.select_cell(0);
        this.select_cell(2, false);

        this.evaluate(function () {
            Jupyter.notebook.move_selection_up();
        });

        // should not move up at top
        assert_order(this, 'move up at top', ['', '1', '2', '3', '4', '5','6'])

        // we do not need to reselect, move/up down should keep the selection. 
        this.evaluate(function () {
            Jupyter.notebook.move_selection_down();
            Jupyter.notebook.move_selection_down();
            Jupyter.notebook.move_selection_down();
            Jupyter.notebook.move_selection_down();
        });

        // 4 times down should move to the 3 cells to the bottom
        assert_order(this, 'move down to bottom', [ '3', '4', '5','6', '', '1', '2'])
        
        this.evaluate(function () {
            Jupyter.notebook.move_selection_down();
        });

        // they can't go any further (test it)
        assert_order(this, 'move at to top', [ '3', '4', '5','6', '', '1', '2'])
        
        this.evaluate(function () {
            Jupyter.notebook.move_selection_up();
            Jupyter.notebook.move_selection_up();
            Jupyter.notebook.move_selection_up();
            Jupyter.notebook.move_selection_up();
        });

        // bring them back on top.
        assert_order(this, 'move up to top', ['', '1', '2', '3', '4', '5','6'])

    });
});
