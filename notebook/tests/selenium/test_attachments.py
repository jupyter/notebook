from pathlib import Path
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from .utils import wait_for_selector, wait_for_xpath

tests_dir = Path(__file__).parent.parent

# TODO: assert attachment for the cell
# TODO: append another markdown cell
# TODO: copy the first cell
# TODO: paste in the new cell
# TODO: assert the attachment of the new cell and that the two cells have the same attachment
# TODO: save the notebook in a new file
# TODO: assert the second cell got garbage collected and first cell still has its attachment

# TODO: !! Figure out how to pass params to pytest fixtures

def test_attachments(notebook):
    browser = notebook.browser
    notebook.focus_cell(index=0)
    notebook.convert_cell_type(cell_type='markdown')

    # Click 'Edit', 'Insert image'
    browser.find_element_by_id('editlink').click()
    wait_for_selector(browser, '#insert_image', visible=True, single=True).click()

    # Upload an image
    # This is the recommended way to use a file input through Selenium:
    # https://stackoverflow.com/a/9735909/434217
    wait_for_xpath(browser, '//input[@type="file"]', single=True).send_keys(
        str(tests_dir / '_testdata' / 'black_square_22.png')
    )
    browser.find_element_by_id('btn_ok').click()

    # Wait for dialog to fade out
    WebDriverWait(browser, 3).until(
        EC.invisibility_of_element((By.CSS_SELECTOR, '.modal-backdrop'))
    )

    # Render the Markdown cell
    notebook.execute_cell(0)

