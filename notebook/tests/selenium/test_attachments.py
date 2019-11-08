from .utils import wait_for_selector
# TODO: insert an image using edit menuitem
# TODO: assert attachment for the cell
# TODO: append another markdown cell
# TODO: copy the first cell
# TODO: paste in the new cell
# TODO: assert the attachment of the new cell and that the two cells have the same attachment
# TODO: save the notebook in a new file
# TODO: assert the second cell got garbage collected and first cell still has its attachment

# TODO: !! Figure out how to pass params to pytest fixtures

def test_attachments(notebook):
    notebook.focus_cell(index=0)
    notebook.convert_cell_type(cell_type='markdown')

    # Click 'Edit', 'Insert image'
    notebook.browser.find_element_by_id('editlink').click()
    wait_for_selector(notebook.browser, '#insert_image', visible=True, single=True).click()





