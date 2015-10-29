//
// Test that the correct cells are executed when there are marked cells.
//
casper.notebook_test(function () {
    var that = this;
    var assert_outputs = function (expected) {
        var msg, i;
        for (i = 0; i < that.get_cells_length(); i++) {
            if (expected[i] === undefined) {
                msg = 'cell ' + i + ' not executed';
                that.test.assertFalse(that.cell_has_outputs(i), msg);

            } else {
                msg = 'cell ' + i + ' executed';
                that.test.assertEquals(that.get_output_cell(i).text, expected[i], msg);
            }
        }
    };

    this.then(function () {
        this.set_cell_text(0, 'print("a")');
        this.append_cell('print("b")');
        this.append_cell('print("c")');
        this.append_cell('print("d")');
        this.test.assertEquals(this.get_cells_length(), 4, "correct number of cells");

        this.evaluate(function () {
            IPython.notebook.unmark_all_cells();
            IPython.notebook.set_marked_indices([1, 2]);
        });
    });

    this.then(function () {
        this.evaluate(function () {
            IPython.notebook.clear_all_output();
        });

        this.select_cell(1);
        this.validate_notebook_state('before execute', 'command', 1);
        this.trigger_keydown('ctrl-enter');
    });

    this.wait_for_output(1);
    this.wait_for_output(2);

    this.then(function () {
        assert_outputs([undefined, 'b\n', 'c\n', undefined]);
        this.validate_notebook_state('run marked cells', 'command', 2);
    });

    // execute cells in place when there are marked cells
    this.then(function () {
        this.evaluate(function () {
            IPython.notebook.clear_all_output();
        });

        this.select_cell(1);
        this.validate_notebook_state('before execute', 'command', 1);
        this.trigger_keydown('shift-enter');
    });

    this.wait_for_output(1);
    this.wait_for_output(2);

    this.then(function () {
        assert_outputs([undefined, 'b\n', 'c\n', undefined]);
        this.validate_notebook_state('run marked cells', 'command', 2);
    });

    // execute and insert below when there are marked cells
    this.then(function () {
        this.evaluate(function () {
            IPython.notebook.clear_all_output();
        });

        this.select_cell(1);
        this.validate_notebook_state('before execute', 'command', 1);
        this.evaluate(function () {
            $("#run_cell_insert_below").click();
        });
    });

    this.wait_for_output(1);
    this.wait_for_output(2);

    this.then(function () {
        assert_outputs([undefined, 'b\n', 'c\n', undefined]);
        this.validate_notebook_state('run marked cells', 'command', 2);
    });

    // check that it doesn't affect run all above
    this.then(function () {
        this.evaluate(function () {
            IPython.notebook.clear_all_output();
        });

        this.select_cell(1);
        this.validate_notebook_state('before execute', 'command', 1);
        this.evaluate(function () {
            $("#run_all_cells_above").click();
        });
    });

    this.wait_for_output(0);

    this.then(function () {
        assert_outputs(['a\n', undefined, undefined, undefined]);
        this.validate_notebook_state('run cells above', 'command', 0);
    });

    // check that it doesn't affect run all below
    this.then(function () {
        this.evaluate(function () {
            IPython.notebook.clear_all_output();
        });

        this.select_cell(1);
        this.validate_notebook_state('before execute', 'command', 1);
        this.evaluate(function () {
            $("#run_all_cells_below").click();
        });
    });

    this.wait_for_output(1);
    this.wait_for_output(2);
    this.wait_for_output(3);

    this.then(function () {
        assert_outputs([undefined, 'b\n', 'c\n', 'd\n']);
        this.validate_notebook_state('run cells below', 'command', 3);
    });

    // check that it doesn't affect run all
    this.then(function () {
        this.evaluate(function () {
            IPython.notebook.clear_all_output();
        });

        this.select_cell(1);
        this.validate_notebook_state('before execute', 'command', 1);
        this.evaluate(function () {
            $("#run_all_cells").click();
        });
    });

    this.wait_for_output(0);
    this.wait_for_output(1);
    this.wait_for_output(2);
    this.wait_for_output(3);

    this.then(function () {
        assert_outputs(['a\n', 'b\n', 'c\n', 'd\n']);
        this.validate_notebook_state('run all cells', 'command', 3);
    });
});
