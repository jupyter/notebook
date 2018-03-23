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
    nb[:] = ["# Foo"]
    nb.convert_cell_type(0, cell_type="markdown")
    for cell in nb:
        nb.execute_cell(cell)
    rendered_cells = nb.browser.find_elements_by_class_name('text_cell_render')
    outputs = [x.get_attribute('innerHTML') for x in rendered_cells]
    expected = '<h1 id="Foo">Foo<a class="anchor-link" href="#Foo">¶</a></h1>'
    assert outputs[0].strip() == expected
