"""
Various output tests.
"""
import pytest
import textwrap

from .utils import wait_for_script_to_return_true

INITIAL_CELLS = [textwrap.dedent("""\
    ip = get_ipython()
    from IPython.display import display
    def display_with_id(obj, display_id, update=False, execute_result=False):
        iopub = ip.kernel.iopub_socket
        session = ip.kernel.session
        data, md = ip.display_formatter.format(obj)
        transient = {'display_id': display_id}
        content = {'data': data, 'metadata': md, 'transient': transient}
        if execute_result:
            msg_type = 'execute_result'
            content['execution_count'] = ip.execution_count
        else:
            msg_type = 'update_display_data' if update else 'display_data'
        session.send(iopub, msg_type, content, parent=ip.parent_header)
    """)]


@pytest.fixture
def get_outputs(notebook):
    def _get_outputs(cell_idx):
        return notebook.browser.execute_script(f"""\
            var cell = Jupyter.notebook.get_cell({cell_idx});
            return cell.output_area.outputs;
            """)
    return _get_outputs


@pytest.fixture
def get_iopub_messages(notebook):
    def _get_iopub_messages(cell_idx):
        script = f"return IPython.notebook.get_cell({cell_idx}).iopub_messages"
        return notebook.browser.execute_script(script)
    return _get_iopub_messages


def test_display_id(prefill_notebook, get_outputs, get_iopub_messages):
    notebook = prefill_notebook(INITIAL_CELLS)
    notebook.execute_cell(0)

    #TODO describe test 1
    notebook.add_and_execute_cell(content=textwrap.dedent("""\
        display('above')
        display_with_id(1, 'here')
        display('below')
        """))
    notebook.wait_for_cell_output(1)

    cell1_outputs = get_outputs(1)
    assert len(cell1_outputs) == 3, 'cell 1 has the right number of outputs'
    assert cell1_outputs[1]['transient']['display_id'] == 'here', 'has transient display_id'
    assert cell1_outputs[1]['data']['text/plain'] == '1', 'display_with_id produces output'

    #TODO describe test 2
    notebook.add_and_execute_cell(content=textwrap.dedent("""\
        display_with_id(2, 'here')
        display_with_id(3, 'there')
        display_with_id(4, 'here')
        """))
    notebook.wait_for_cell_output(2)

    cell1_outputs = get_outputs(1)
    assert cell1_outputs[1]['data']['text/plain'] == '4'
    assert len(cell1_outputs) == 3, 'cell 1 still has the right number of outputs'
    cell2_outputs = get_outputs(2)
    assert len(cell2_outputs) == 3, 'cell 2 has the right number of outputs'
    assert cell2_outputs[0]['transient']['display_id'] == 'here', 'check display id 0'
    assert cell2_outputs[0]['data']['text/plain'] == '4', 'output[2][0]'
    assert cell2_outputs[1]['transient']['display_id'] == 'there', 'display id 1'
    assert cell2_outputs[1]['data']['text/plain'] == '3', 'output[2][1]'
    assert cell2_outputs[2]['transient']['display_id'] == 'here', 'display id 2'
    assert cell2_outputs[2]['data']['text/plain'] == '4', 'output[2][2]'

    # Test output callback overrides work with display ids.
    notebook.browser.execute_script(textwrap.dedent("""\
        Jupyter.notebook.insert_cell_at_index("code", 3);
        var cell = Jupyter.notebook.get_cell(3);
        cell.set_text([
            "display_with_id(5, 'here')",
            "display_with_id(6, 'here', update=True)",
        ].join('\\n'));
        cell.execute();

        var cell = IPython.notebook.get_cell(3);
        var kernel = IPython.notebook.kernel;
        var msg_id = cell.last_msg_id;
        var callback_id = 'mycallbackid'
        cell.iopub_messages = [];
        var add_msg = function(msg) {
            msg.content.output_type = msg.msg_type;
            cell.iopub_messages.push(msg.content);
        };
        kernel.set_callbacks_for_msg(callback_id, {
            iopub: {
                output: add_msg,
                clear_output: add_msg,
            }
        }, false);
        kernel.output_callback_overrides_push(msg_id, callback_id);
        """))

    wait_for_script_to_return_true(
        notebook.browser,
        "return IPython.notebook.get_cell(3).iopub_messages.length >= 2;"
    )

    cell3_outputs = get_outputs(3)
    cell3_iopub_messages = get_iopub_messages(3)

    assert len(cell3_outputs) == 0, "correct number of cell outputs"
    assert len(cell3_iopub_messages) == 2, "correct number of callback outputs"
    assert cell3_iopub_messages[0]['output_type'] == 'display_data', 'check output_type 0'
    assert cell3_iopub_messages[0]['transient']['display_id'] == 'here', 'check display id 0'
    assert cell3_iopub_messages[0]['data']['text/plain'] == '5', 'value'
    assert cell3_iopub_messages[1]['output_type'] == 'update_display_data', 'check output_type 1'
    assert cell3_iopub_messages[1]['data']['text/plain'] == '6', 'value'
    assert cell3_iopub_messages[1]['transient']['display_id'] == 'here', 'display id 1'

    #TODO describe test 4
    notebook.add_and_execute_cell(content=textwrap.dedent("""\
        display_with_id(7, 'here')
        display_with_id(8, 'here', update=True)
        display_with_id(9, 'result', execute_result=True)
        """))

    notebook.add_and_execute_cell(content=textwrap.dedent("""\
        display_with_id(10, 'result', update=True)
        1
        """))

    notebook.wait_for_cell_output(4)
    notebook.wait_for_cell_output(5)

    cell3_iopub_messages = get_iopub_messages(3)
    cell4_outputs = get_outputs(4)

    assert len(cell4_outputs) == 2, "correct number of cell outputs"
    assert len(cell3_iopub_messages) == 4, "correct number of callback outputs"
    assert cell3_iopub_messages[0]['output_type'] == 'display_data', 'check output_type 0'
    assert cell3_iopub_messages[0]['transient']['display_id'] == 'here', 'check display id 0'
    assert cell3_iopub_messages[0]['data']['text/plain'] == '5', 'value'
    assert cell3_iopub_messages[1]['output_type'] == 'update_display_data', 'check output_type 1'
    assert cell3_iopub_messages[1]['transient']['display_id'] == 'here', 'display id 1'
    assert cell3_iopub_messages[1]['data']['text/plain'] == '6', 'value'
    assert cell3_iopub_messages[2]['output_type'] == 'display_data', 'check output_type 2'
    assert cell3_iopub_messages[2]['transient']['display_id'] == 'here', 'check display id 2'
    assert cell3_iopub_messages[2]['data']['text/plain'] == '7', 'value'
    assert cell3_iopub_messages[3]['output_type'] == 'update_display_data', 'check output_type 3'
    assert cell3_iopub_messages[3]['transient']['display_id'] == 'here', 'display id 3'
    assert cell3_iopub_messages[3]['data']['text/plain'] == '8', 'value'

    assert cell4_outputs[1]['data']['text/plain'] == '10', 'update execute_result'
