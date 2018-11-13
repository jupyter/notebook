"""Tests buffering of execution requests."""

from .utils import wait_for_selector


def wait_for_cell_text_output(notebook, index):
    cell = notebook.cells[index]
    output = wait_for_selector(cell, ".output_text", single=True)
    return output.text


def wait_for_kernel_ready(notebook):
    wait_for_selector(notebook.browser, ".kernel_idle_icon")


def kernels_buffer_without_conn(notebook):
    """Test that execution request made while disconnected is buffered."""
    # Assert that cell executed while kernel is disconnected still
    # executes when reconnected
    wait_for_kernel_ready(notebook)
    notebook.browser.execute_script("IPython.notebook.kernel.stop_channels();")
    notebook.edit_cell(index=0, content="print(1 + 2)")
    notebook.execute_cell(0)
    notebook.browser.execute_script("IPython.notebook.kernel.reconnect();")
    wait_for_kernel_ready(notebook)
    assert wait_for_cell_text_output(notebook, 0) == "3"
    notebook.delete_cell(0)


def buffered_cells_execute_in_order(notebook):
    """Test that buffered requests execute in order."""
    notebook.append('k=1', 'k+=1', 'k*=3', 'print(k)')

    # Repeated execution of cell queued up in the kernel executes
    # each execution request in order.
    wait_for_kernel_ready(notebook)
    notebook.browser.execute_script("IPython.notebook.kernel.stop_channels();")
    # k == 1
    notebook.execute_cell(1)
    # k == 2
    notebook.execute_cell(2)
    # k == 6
    notebook.execute_cell(3)
    # k == 7
    notebook.execute_cell(2)
    notebook.execute_cell(4)
    notebook.browser.execute_script("IPython.notebook.kernel.reconnect();")
    wait_for_kernel_ready(notebook)

    # Check that current value of k is 7
    assert wait_for_cell_text_output(notebook, 4) == "7"


def test_buffering(notebook):
    kernels_buffer_without_conn(notebook)
    buffered_cells_execute_in_order(notebook)
