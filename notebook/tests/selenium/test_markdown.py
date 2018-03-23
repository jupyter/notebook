import os

import pytest
from selenium.webdriver.common.keys import Keys

from .utils import wait_for_selector, Notebook

pjoin = os.path.join
    

@pytest.fixture(scope='module')
def notebook(authenticated_browser):
    return Notebook.new_notebook(authenticated_browser)


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
