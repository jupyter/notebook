//
// Test undeleting cells.
//
casper.notebook_test(function () {
    var that = this;

    var assert_selected_cells = function (action, indices) {
        var  selected = that.evaluate(function () {
            return IPython.notebook.get_selected_cells_indices();
        });
        that.test.assertEquals( selected, indices, action + "; verify  selected cells");
    };

    var assert_cells = function (action, cells, index) {
        var msg = action + "; there are " + cells.length + " cells";
        that.test.assertEquals(that.get_cells_length(), cells.length, msg);

        var i;
        for (i = 0; i < cells.length; i++) {
            msg = action + "; cell " + i + " has correct text";
            that.test.assertEquals(that.get_cell_text(i), cells[i], msg);
        }

        that.validate_notebook_state(action, 'command', index);
        assert_selected_cells(action, [index]);
    };

    var a = 'print("a")';
    this.set_cell_text(0, a);

    var b = 'print("b")';
    this.append_cell(b);

    var c = 'print("c")';
    this.append_cell(c);

    var d = 'print("d")';
    this.append_cell(d);

    // Verify initial state
    this.select_cell(0);
    this.trigger_keydown('esc');
    assert_cells("initial state", [a, b, c, d], 0);

    // Delete cell 1
    this.select_cell(1);
    this.trigger_keydown('esc');
    this.trigger_keydown('d', 'd');
    assert_cells("delete cell 1", [a, c, d], 1);

    // Undelete cell 1
    this.evaluate(function () {
        IPython.notebook.undelete_cell();
    });
    assert_cells("undelete cell 1", [a, b, c, d], 2);

    // Merge cells 1-2
    var bc = b + "\n\n" + c;
    this.select_cell(1);
    this.trigger_keydown('esc');
    this.trigger_keydown('shift-j');
    assert_selected_cells("select cells 1-2", [1, 2]);
    this.trigger_keydown('shift-m');
    this.trigger_keydown('esc');
    assert_cells("merge cells 1-2", [a, bc, d], 1);

    // Undo merge
    this.evaluate(function () {
        IPython.notebook.undelete_cell();
    });
    assert_cells("undo merge", [a, bc, c, d], 1);

    // Merge cells 3-2
    var cd = c + "\n\n" + d;
    this.select_cell(3);
    this.trigger_keydown('esc');
    this.trigger_keydown('shift-k');
    assert_selected_cells("select cells 3-2", [2, 3]);
    this.trigger_keydown('shift-m');
    this.trigger_keydown('esc');
    assert_cells("merge cells 3-2", [a, bc, cd], 2);

    // Undo merge
    this.evaluate(function () {
        IPython.notebook.undelete_cell();
    });
    assert_cells("undo merge", [a, bc, cd, d], 2);

    // Merge below
    var abc = a + "\n\n" + bc;
    this.select_cell(0);
    this.trigger_keydown('esc');
    this.evaluate(function () {
        IPython.notebook.merge_cell_below();
    });
    assert_cells("merge cell below", [abc, cd, d], 0);

    // Undo merge
    this.evaluate(function () {
        IPython.notebook.undelete_cell();
    });
    assert_cells("undo merge", [abc, bc, cd, d], 0);

    // Merge above
    var bccd = bc + "\n\n" + cd;
    this.select_cell(2);
    this.trigger_keydown('esc');
    this.evaluate(function () {
        IPython.notebook.merge_cell_above();
    });
    assert_cells("merge cell above", [abc, bccd, d], 1);

    // Undo merge
    this.evaluate(function () {
        IPython.notebook.undelete_cell();
    });
    assert_cells("undo merge", [abc, bc, bccd, d], 2);
});
