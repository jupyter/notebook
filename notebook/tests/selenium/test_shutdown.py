"""Tests shutdown of the Kernel."""

def test_shutdown(notebook):
    notebook.edit_cell(content="print(21)")
    notebook.browser.find_element_by_xpath('//a[text()="Kernel"]').click()
    notebook.browser.find_element_by_id('shutdown_kernel').click()
    notebook.browser.find_element_by_class_name('btn.btn-default.btn-sm.btn-danger').click()

    notebook.wait_for_element_availability("cell")
    notebook.execute_cell(0)

    assert not notebook.is_kernel_running()
    assert notebook.get_cell_output() == None