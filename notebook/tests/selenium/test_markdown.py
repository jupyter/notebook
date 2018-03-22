import os

import pytest
from selenium.webdriver.common.keys import Keys

from .utils import wait_for_selector, Notebook

pjoin = os.path.join
    

@pytest.fixture(scope='module')
def notebook(authenticated_browser):
    b = authenticated_browser
    new_button = b.find_element_by_id('new-buttons')
    new_button.click()
    kernel_selector = '#kernel-python3 a'
    kernel_list = wait_for_selector(b, kernel_selector)
    kernel_list[0].click()
    window_handle_list = b.window_handles
    window_handle_list.remove(b.current_window_handle)
    b.switch_to_window(window_handle_list[0])
    kernel_list = wait_for_selector(b, ".cell")
    b.execute_script("Jupyter.notebook.set_autosave_interval(0)")
    return Notebook(b)


def test_markdown_cell(notebook):
    nb = notebook
    cell = nb.cells[0]
    nb.convert_cell_type(cell_type="markdown")
    assert nb.current_cell != cell
    nb.edit_cell(index=0, content="# Foo")
    nb.wait_for_stale_cell(cell)
    rendered_cells = nb.browser.find_elements_by_class_name('text_cell_render')
    outputs = [x.get_attribute('innerHTML') for x in rendered_cells]
    expected = '<h1 id="Foo">Foo<a class="anchor-link" href="#Foo">¶</a></h1>'
    assert outputs[0].strip() == expected
