import os

import pytest
from selenium.webdriver.common.keys import Keys

from .utils import wait_for_selector, Notebook

pjoin = os.path.join
    

@pytest.fixture(scope='module')
def notebook(authenticated_browser):
    return Notebook.new_notebook(authenticated_browser)


def get_rendered_contents(nb):
    cl = ["text_cell", "render"]
    rendered_cells = [cell.find_element_by_class_name("text_cell_render") 
                      for cell in nb.cells 
                      if all([c in cell.get_attribute("class") for c in cl])]
    return [x.get_attribute('innerHTML').strip()
            for x in rendered_cells 
            if x is not None]

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
