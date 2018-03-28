from selenium.webdriver import ActionChains
from selenium.webdriver.common.keys import Keys

def get_cells_contents(nb):
    return [c.find_element_by_class_name('input_area').text
            for c in nb.cells]

def shift_down(browser):
    ActionChains(browser)\
        .key_down(Keys.SHIFT).send_keys(Keys.DOWN).key_up(Keys.SHIFT)\
        .perform()

def test_undelete_cells(notebook):
    a = 'print("a")'
    b = 'print("b")'
    c = 'print("c")'
    d = 'print("d")'

    notebook.edit_cell(index=0, content=a)
    notebook.append(b, c, d)
    notebook.focus_cell(0)

    # Verify initial state
    assert get_cells_contents(notebook) == [a, b, c, d]

    # Delete cells [1, 2]
    notebook.focus_cell(1)
    shift_down(notebook.browser)
    notebook.current_cell.send_keys('dd')
    assert get_cells_contents(notebook) == [a, d]

    # Delete new cell 1 (which contains d)
    notebook.focus_cell(1)
    notebook.current_cell.send_keys('dd')
    assert get_cells_contents(notebook) == [a]

    # Undelete d
    notebook.browser.execute_script('Jupyter.notebook.undelete_cell();')
    assert get_cells_contents(notebook) == [a, d]

    # Undelete b, c
    notebook.browser.execute_script('Jupyter.notebook.undelete_cell();')
    assert get_cells_contents(notebook) == [a, b, c, d]


