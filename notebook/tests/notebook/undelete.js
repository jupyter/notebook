//
// Test undeleting cells.
//
casper.notebook_test(function () {
    var that = this;

    var assert_marked_cells = function (action, indices) {
        var marked = that.evaluate(function () {
            return IPython.notebook.get_marked_indices();
        });
        that.test.assertEquals(marked, indices, action + "; verify marked cells");
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
        assert_marked_cells(action, []);
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
    assert_marked_cells("select cells 1-2", [1, 2]);
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
    assert_marked_cells("select cells 3-2", [2, 3]);
    this.trigger_keydown('shift-m');
    this.trigger_keydown('esc');
    assert_cells("merge cells 3-2", [a, bc, cd], 2);

    // Undo merge
    this.evaluate(function () {
        IPython.notebook.undelete_cell();
    });
    assert_cells("undo merge", [a, bc, cd, d], 2);
});
