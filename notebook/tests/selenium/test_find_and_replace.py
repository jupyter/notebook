import pytest


def test_find_and_replace(notebook):
    """ test find and replace on all the cells """
    cell_0, cell_1, cell_2, cell_3 = "hello", "hellohello", "abc", "ello"

    find_str = "ello"                            # string to replace
    replace_str = "foo"                          # string to replace to

    # set the contents of the cells
    notebook.add_cell(index=0, content=cell_0);
    notebook.add_cell(index=1, content=cell_1);
    notebook.add_cell(index=2, content=cell_2);
    notebook.add_cell(index=3, content=cell_3);

    # replace the strings
    notebook.find_and_replace(index=0, find_txt=find_str, replace_txt=replace_str)

    # check content of the cells
    assert notebook.get_cell_contents(0) == cell_0.replace(find_str, replace_str)
    assert notebook.get_cell_contents(1) == cell_1.replace(find_str, replace_str)
    assert notebook.get_cell_contents(2) == cell_2.replace(find_str, replace_str)
    assert notebook.get_cell_contents(3) == cell_3.replace(find_str, replace_str)
