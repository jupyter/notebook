//
// Various output tests
//

casper.notebook_test(function () {
    
    function get_outputs(cell_idx) {
        var outputs_json = casper.evaluate(function (cell_idx) {
            var cell = Jupyter.notebook.get_cell(cell_idx);
            return JSON.stringify(cell.output_area.outputs);
        }, {cell_idx: cell_idx});
        return JSON.parse(outputs_json);
    }
    
    this.thenEvaluate(function () {
        Jupyter.notebook.insert_cell_at_index("code", 0);
        var cell = Jupyter.notebook.get_cell(0);
        cell.set_text([
            "ip = get_ipython()",
            "from IPython.display import display",
            "def display_with_id(obj, display_id, update=False):",
            "  iopub = ip.kernel.iopub_socket",
            "  session = get_ipython().kernel.session",
            "  data, md = ip.display_formatter.format(obj)",
            "  transient = {'display_id': display_id}",
            "  content = {'data': data, 'metadata': md, 'transient': transient}",
            "  msg_type = 'update_display_data' if update else 'display_data'",
            "  session.send(iopub, msg_type, content, parent=ip.parent_header)",
            "",
        ].join('\n'));
        cell.execute();
    });

    this.thenEvaluate(function () {
        Jupyter.notebook.insert_cell_at_index("code", 1);
        var cell = Jupyter.notebook.get_cell(1);
        cell.set_text([
            "display('above')",
            "display_with_id(1, 'here')",
            "display('below')",
        ].join('\n'));
        cell.execute();
    });

    this.wait_for_output(1);

    this.then(function () {
        var outputs = get_outputs(1);
        this.test.assertEquals(outputs.length, 3, 'cell 1 has the right number of outputs');
        this.test.assertEquals(outputs[1].transient.display_id, 'here', 'has transient display_id');
        this.test.assertEquals(outputs[1].data['text/plain'], '1', 'display_with_id produces output');
    });


    this.thenEvaluate(function () {
        Jupyter.notebook.insert_cell_at_index("code", 2);
        var cell = Jupyter.notebook.get_cell(2);
        cell.set_text([
            "display_with_id(2, 'here')",
            "display_with_id(3, 'there')",
            "display_with_id(4, 'here')",
        ].join('\n'));
        cell.execute();
    });

    this.wait_for_output(2);

    this.then(function () {
        var outputs1 = get_outputs(1);
        this.test.assertEquals(outputs1[1].data['text/plain'], '4', '');
        this.test.assertEquals(outputs1.length, 3, 'cell 1 still has the right number of outputs');
        var outputs2 = get_outputs(2);
        this.test.assertEquals(outputs2.length, 3, 'cell 2 has the right number of outputs');
        this.test.assertEquals(outputs2[0].transient.display_id, 'here', 'check display id 0');
        this.test.assertEquals(outputs2[0].data['text/plain'], '4', 'output[2][0]');
        this.test.assertEquals(outputs2[1].transient.display_id, 'there', 'display id 1');
        this.test.assertEquals(outputs2[1].data['text/plain'], '3', 'output[2][1]');
        this.test.assertEquals(outputs2[2].transient.display_id, 'here', 'display id 2');
        this.test.assertEquals(outputs2[2].data['text/plain'], '4', 'output[2][2]');
    });

});
