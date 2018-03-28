from selenium.webdriver.common.keys import Keys
from .utils import shift

def get_cells_contents(nb):
    JS = 'return Jupyter.notebook.get_cells().map(function(c) {return c.get_text();})'
    return nb.browser.execute_script(JS)

def undelete(nb):
    nb.browser.execute_script('Jupyter.notebook.undelete_cell();')

def test_undelete_cells(notebook):
    a = 'print("a")'
    b = 'print("b")'
    c = 'print("c")'
    d = 'print("d")'

    notebook.edit_cell(index=0, content=a)
    notebook.append(b, c, d)
    notebook.to_command_mode()

    # Verify initial state
    assert get_cells_contents(notebook) == [a, b, c, d]

    # Delete cells [1, 2]
    notebook.focus_cell(1)
    shift(notebook.browser, Keys.DOWN)
    notebook.current_cell.send_keys('dd')
    assert get_cells_contents(notebook) == [a, d]

    # Delete new cell 1 (which contains d)
    notebook.focus_cell(1)
    notebook.current_cell.send_keys('dd')
    assert get_cells_contents(notebook) == [a]

    # Undelete d
    undelete(notebook)
    assert get_cells_contents(notebook) == [a, d]

    # Undelete b, c
    undelete(notebook)
    assert get_cells_contents(notebook) == [a, b, c, d]

    # Nothing more to undelete
    undelete(notebook)
    assert get_cells_contents(notebook) == [a, b, c, d]

    # Delete first two cells and restore
    notebook.focus_cell(0)
    shift(notebook.browser, Keys.DOWN)
    notebook.current_cell.send_keys('dd')
    assert get_cells_contents(notebook) == [c, d]
    undelete(notebook)
    assert get_cells_contents(notebook) == [a, b, c, d]

    # Delete last two cells and restore
    notebook.focus_cell(-1)
    shift(notebook.browser, Keys.UP)
    notebook.current_cell.send_keys('dd')
    assert get_cells_contents(notebook) == [a, b]
    undelete(notebook)
    assert get_cells_contents(notebook) == [a, b, c, d]

    # Merge cells [1, 2], restore the deleted one
    bc = b + "\n\n" + c
    notebook.focus_cell(1)
    shift(notebook.browser, 'j')
    shift(notebook.browser, 'm')
    assert get_cells_contents(notebook) == [a, bc, d]
    undelete(notebook)
    assert get_cells_contents(notebook) == [a, bc, c, d]

    # Merge cells [2, 3], restore the deleted one
    cd = c + "\n\n" + d
    notebook.focus_cell(-1)
    shift(notebook.browser, 'k')
    shift(notebook.browser, 'm')
    assert get_cells_contents(notebook) == [a, bc, cd]
    undelete(notebook)
    assert get_cells_contents(notebook) == [a, bc, cd, d]

    # Reset contents to [a, b, c, d] --------------------------------------
    notebook.edit_cell(index=1, content=b)
    notebook.edit_cell(index=2, content=c)
    assert get_cells_contents(notebook) == [a, b, c, d]

    # Merge cell below, restore the deleted one
    ab = a + "\n\n" + b
    notebook.focus_cell(0)
    notebook.browser.execute_script("Jupyter.notebook.merge_cell_below();")
    assert get_cells_contents(notebook) == [ab, c, d]
    undelete(notebook)
    assert get_cells_contents(notebook) == [ab, b, c, d]

    # Merge cell above, restore the deleted one
    cd = c + "\n\n" + d
    notebook.focus_cell(-1)
    notebook.browser.execute_script("Jupyter.notebook.merge_cell_above();")
    assert get_cells_contents(notebook) == [ab, b, cd]
    undelete(notebook)
    assert get_cells_contents(notebook) == [ab, b, c, cd]
