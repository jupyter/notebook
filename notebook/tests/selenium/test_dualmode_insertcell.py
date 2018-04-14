

def test_insert_cell(notebook):
    a = 'print("a")'
    b = 'print("b")'
    c = 'print("c")'

    notebook.edit_cell(index=0, content=a)
    notebook.append(b, c)
    notebook.to_command_mode()

    assert notebook.get_cells_contents() == [a, b, c] 

    notebook.to_command_mode()
    notebook.focus_cell(2)
    notebook.convert_cell_type(2, "markdown")
    notebook.current_cell.send_keys("a")
    assert notebook.get_cell_contents(2) == ''
    assert notebook.get_cell_type(2) == 'code'
    assert len(notebook.cells) == 4
    
    notebook.current_cell.send_keys('b')
    assert notebook.get_cell_contents(2) == ''
    assert notebook.get_cell_contents(3) == ''
    assert notebook.get_cell_type(3) == 'code'
    assert len(notebook.cells) == 5

    notebook.focus_cell(2)
    notebook.convert_cell_type(2, "markdown")
    assert notebook.get_cell_type(2) == "markdown"
    notebook.current_cell.send_keys("a")
    assert notebook.get_cell_type(3) == "markdown"
    notebook.current_cell.send_keys("b")
    assert notebook.get_cell_type(4) == "markdown"
