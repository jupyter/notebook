//
// Test buffering for execution requests.
//
casper.notebook_test(function () {
    this.evaluate(function () {
        var cell = IPython.notebook.get_cell(0);
        cell.set_text('a=10; print(a)');
        IPython.notebook.kernel.stop_channels();
        IPython.notebook.execute_cells([0]);
        IPython.notebook.kernel.reconnect(1);
    });

    this.wait_for_output(0);

    this.then(function () {
        var result = this.get_output_cell(0);
        this.test.assertEquals(result.text, '10\n', 'kernels buffer execution requests if connection is down');
    });
    
    this.thenEvaluate(function () {
        var cell = IPython.notebook.get_cell(0);
        cell.set_text('a=11; print(a)');
        cell.kernel = null;
        IPython.notebook.kernel = null;
        IPython.notebook.execute_cells([0]);
        IPython.notebook._session_started();
    });

    this.wait_for_output(0);

    this.then(function () {
        var result = this.get_output_cell(0);
        this.test.assertEquals(result.text, '11\n', 'notebooks buffer cell execution requests if kernel is not set');
    });
    
});
