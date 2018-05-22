# selenium test version for 'empty_arrow_keys.js'


def remove_cells(notebook):
    for i in notebook.cells:
        notebook.delete_cell(notebook.index(i))

def test_empty_arrows_keys(notebook):
    # delete all the cells
    notebook.trigger_keydown('up')
    notebook.trigger_keydown('down')
    remove_cells(notebook)
    assert len(notebook.cells) == 1    # notebook should create one automatically on empty notebook
