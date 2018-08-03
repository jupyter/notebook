from .utils import wait_for_selector
# TODO: create a markdown cell
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
    notebook.add_cell(cell_type="markdown")
    notebook.focus_cell(index=1)
    notebook.convert_cell_type(cell_type='markdown')
    edit_menu = notebook.browser.find_elements_by_css_selector('.navbar-default .navbar-nav > li > a')[1]
    insert_menuitem = notebook.browser.find_element_by_css_selector('#insert_image')
    # import pdb; pdb.set_trace()
    notebook.browser.execute_script("arguments[0].scrollIntoView(true);", insert_menuitem)
    insert_menuitem.click()





