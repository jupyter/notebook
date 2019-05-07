"""Test"""
from selenium.webdriver.common.keys import Keys
from .utils import shift

def test_dualmode_clipboard(notebook):

    def validate_selected_cell(index):
        JS = "return Jupyter.notebook.get_selected_cells_indices();"
        cell_index = notebook.browser.execute_script(JS)
        assert cell_index == [index] #only the index cell is selected

    def validate_mode(mode):
        JS = "return IPython.keyboard_manager.mode;"
        keyboard_mode = notebook.browser.execute_script(JS)
        assert mode == keyboard_mode #keyboard mode is correct
    
    def no_cells_in_edit_mode():    
        cells_mode = notebook.get_cells_mode()
        for mode in cells_mode:
            assert mode != 'edit'
    
    def no_focused_cells():
        JS = "return $('#notebook .CodeMirror-focused textarea').length;"
        focused_cells = notebook.browser.execute_script(JS)
        assert focused_cells == 0
    
    def validate_notebook_state(mode, index):
        validate_selected_cell(index)
        validate_mode(mode)
        no_cells_in_edit_mode()
        no_focused_cells()



    a = 'print("a")'
    notebook.append(a)
    notebook.execute_cell(1)

    b = 'print("b")'
    notebook.append(b)
    notebook.execute_cell(2)

    c = 'print("c")'
    notebook.append(c)
    notebook.execute_cell(3)

    num_cells = len(notebook.cells)
    assert notebook.get_cell_contents(1) == a #Cell 1 is a

    notebook.focus_cell(1)
    notebook.body.send_keys("x") #Cut
    validate_notebook_state('command', 1)
    assert notebook.get_cell_contents(1) == b #Cell 2 is now where cell 1 was
    assert len(notebook.cells) == num_cells-1 #A cell was removed
    
    notebook.focus_cell(2)
    notebook.body.send_keys("v") #Paste
    validate_notebook_state('command', 3)
    assert notebook.get_cell_contents(3) == a #Cell 3 has the cut contents
    assert len(notebook.cells) == num_cells   #A cell was added
    
    notebook.body.send_keys("v") #Paste
    validate_notebook_state('command', 4)
    assert notebook.get_cell_contents(4) == a #Cell a has the cut contents
    assert len(notebook.cells) == num_cells+1 #A cell was added

    notebook.focus_cell(1)
    notebook.body.send_keys("c") #Copy
    validate_notebook_state('command', 1)
    assert notebook.get_cell_contents(1) == b #Cell 1 is b

    notebook.focus_cell(2)
    notebook.body.send_keys("c") #Copy
    validate_notebook_state('command', 2)
    assert notebook.get_cell_contents(2) == c #Cell 2 is c

    notebook.focus_cell(4)
    notebook.body.send_keys("v") #Paste
    validate_notebook_state('command', 5)
    assert notebook.get_cell_contents(2) == c #Cell 2 has the copied contents
    assert notebook.get_cell_contents(5) == c #Cell 5 has the copied contents
    assert len(notebook.cells) == num_cells+2 #A cell was added

    notebook.focus_cell(0)
    shift(notebook.browser, 'v') #Paste
    validate_notebook_state('command', 0)
    assert notebook.get_cell_contents(0) == c #Cell 0 has the copied contents
    assert len(notebook.cells) == num_cells+3 #A cell was added