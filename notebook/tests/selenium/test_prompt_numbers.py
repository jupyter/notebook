import os
import pytest
import time

# selenium test version for 'prompt_numbers.js' 

def get_prompt(nb, index):
    cell = nb.cells[0]
    return cell.find_element_by_class_name('input').find_element_by_class_name('input_prompt').get_attribute('innerHTML').strip() 

def set_prompt(nb, index, value):
    nb.set_cell_input_prompt(index, value)

def test_prompt_numbers(notebook):
    cell_index = 0
    a = 'print("a")'
    notebook.edit_cell(index=cell_index, content=a)
    assert get_prompt(notebook, cell_index) == "<bdi>In</bdi>&nbsp;[&nbsp;]:"
    set_prompt(notebook, cell_index, 2);
    assert get_prompt(notebook, cell_index) == "<bdi>In</bdi>&nbsp;[2]:"
    set_prompt(notebook, cell_index, 0);
    assert get_prompt(notebook, cell_index) == "<bdi>In</bdi>&nbsp;[0]:"
    set_prompt(notebook, cell_index, "'*'");
    assert get_prompt(notebook, cell_index) == "<bdi>In</bdi>&nbsp;[*]:"
    set_prompt(notebook, cell_index, "undefined");
    assert get_prompt(notebook, cell_index) == "<bdi>In</bdi>&nbsp;[&nbsp;]:"
    set_prompt(notebook, cell_index, "null");
    assert get_prompt(notebook, cell_index) == "<bdi>In</bdi>&nbsp;[&nbsp;]:"
