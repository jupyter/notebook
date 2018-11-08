"""Tests the merge cell api."""

def test_merge_cells(notebook):
    # Add cells to notebook
    a = "foo = 5"
    b = "bar = 10"
    c = "baz = 15"
    d = "print(foo)"
    e = "print(bar)"
    f = "print(baz)"
    notebook.edit_cell(index=0, content=a)
    notebook.append(b, c, d, e, f)

    # Before merging, there are 6 separate cells
    assert notebook.get_cells_contents() == [a, b, c, d, e, f]

    # Focus on the second cell and merge it with the cell above
    notebook.focus_cell(1)
    notebook.browser.execute_script("Jupyter.notebook.merge_cell_above();")
    merged_a_b = "%s\n\n%s" % (a, b)
    assert notebook.get_cells_contents() == [merged_a_b, c, d, e, f]

    # Focus on the second cell and merge it with the cell below
    notebook.focus_cell(1)
    notebook.browser.execute_script("Jupyter.notebook.merge_cell_below();")
    merged_c_d = "%s\n\n%s" % (c, d)
    assert notebook.get_cells_contents() == [merged_a_b, merged_c_d, e, f]

    # Merge everything down to a single cell with selected cells
    notebook.select_cell_range(0,3)
    notebook.browser.execute_script("Jupyter.notebook.merge_selected_cells();")
    merged_all = "%s\n\n%s\n\n%s\n\n%s" % (merged_a_b, merged_c_d, e, f)
    assert notebook.get_cells_contents() == [merged_all]

