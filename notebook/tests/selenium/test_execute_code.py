from selenium.webdriver.common.keys import Keys
from .utils import shift, cmdtrl, wait_for_selector
import time


def test_execute_code(notebook):
    def get_output_text(index=0):
        result = notebook.get_cell_output(index=index)
        return result[0].text 
    
    def clear_outputs():
        return notebook.browser.execute_script(
            "Jupyter.notebook.clear_all_output();")

    notebook.edit_cell(index=0, content='a=10; print(a)')
    notebook.execute_cell(0)
    wait_for_selector(notebook.browser, 'div.output_area')
    assert get_output_text() == '10', 'cell execute (using js)'

    notebook.edit_cell(index=0, content='a=11; print(a)')
    clear_outputs()
    shift(notebook.browser, Keys.ENTER)
    notebook.delete_cell(index=1)
    wait_for_selector(notebook.browser, 'div.output_area')
    assert get_output_text() == '11', 'cell execute (using shift-enter)'

    notebook.edit_cell(index=0, content='a=12; print(a)')
    clear_outputs()
    cmdtrl(notebook.browser, Keys.ENTER)
    wait_for_selector(notebook.browser, 'div.output_area')
    assert get_output_text() == '12', 'cell execute (using ctrl-enter)'

    notebook.edit_cell(index=0, content='a=13; print(a)')
    clear_outputs()
    notebook.browser.find_element_by_css_selector(
        "button[data-jupyter-action='jupyter-notebook:run-cell-and-select-next']").click()
    wait_for_selector(notebook.browser, 'div.output_area')
    assert get_output_text() == '13', 'cell execute (cell execute (using "play" toolbar button))'

    notebook.edit_cell(index=0, content='raise IOError')
    notebook.edit_cell(index=1, content='a=14; print(a)')
    clear_outputs()
    notebook.execute_cell(1)
    wait_for_selector(notebook.browser, 'div.output_area')
    assert get_output_text(1) == '14', "cell execute, don't stop on error"

    clear_outputs()
    notebook.browser.execute_script(
            "Jupyter.notebook.execute_all_cells;")
    assert len(notebook.get_cell_output(index=1)) == 0, "cell execute, stop on error (default)"

