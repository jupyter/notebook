"""Tests the merge cell api."""

def test_merge_cells(notebook):
    # Add cells to notebook
    a = "foo = 5"
    b = "bar = 10"
    c = "print(foo)"
    d = "print(bar)"
    notebook.edit_cell(index=0, content=a)
    notebook.append(b, c, d)

    # Before merging, there are 4 separate cells
    assert notebook.get_cells_contents() == [a, b, c, d]

    # Focus on the second cell and merge it with the cell above
    notebook.focus_cell(1)
    notebook.browser.execute_script("Jupyter.notebook.merge_cell_above();")
    merged_a_b = "%s\n\n%s" % (a, b)
    assert notebook.get_cells_contents() == [merged_a_b, c, d]

    # Focus on the second cell and merge it with the cell below
    notebook.focus_cell(1)
    notebook.browser.execute_script("Jupyter.notebook.merge_cell_below();")
    merged_c_d = "%s\n\n%s" % (c, d)
    assert notebook.get_cells_contents() == [merged_a_b, merged_c_d]

    # Merge everything down to a single cell
    notebook.focus_cell(0)
    notebook.browser.execute_script("Jupyter.notebook.merge_cell_below();")
    merged_all = "%s\n\n%s" % (merged_a_b, merged_c_d)
    assert notebook.get_cells_contents() == [merged_all]

