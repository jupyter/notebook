import os

from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

pjoin = os.path.join

def wait_for_selector(browser, selector, timeout=10, visible=False):
    wait = WebDriverWait(browser, timeout)
    if not visible:
        return wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, selector)))
    else:
        return wait.until(EC.visibility_of_all_element_located((By.CSS_SELECTOR, selector)))


class CellTypeError(ValueError):
    
    def __init__(self, message=""):
        self.message = message

class Notebook:
    
    def __init__(self, browser):
        self.browser = browser
        self.remove_safety_check()

    @property
    def body(self):
        return self.browser.find_element_by_tag_name("body")

    @property
    def cells(self):
        return self.browser.find_elements_by_class_name("cell")


    @property
    def current_cell_index(self):
        return self.cells.index(self.current_cell)

    def remove_safety_check(self):
        """Disable request to save before closing window.
        
        This is most easily done by using js directly.
        """
        self.browser.execute_script("window.onbeforeunload = null;")

    def to_command_mode(self):
        """Changes us into command mode on currently focused cell
        """
        self.browser.switch_to.active_element.send_keys(Keys.ESCAPE)
        self.browser.execute_script("return Jupyter.notebook.handle_command_mode("
                                       "Jupyter.notebook.get_cell("
                                           "Jupyter.notebook.get_edit_index()))")

    def focus_cell(self, index=0):
        cell = self.cells[index]
        cell.click()
        self.to_command_mode()
        self.current_cell = cell

    def convert_cell_type(self, index=0, cell_type="code"):
        # TODO add check to see if it is already present
        self.focus_cell(index)
        cell = self.cells[index]
        if cell_type == "markdown":
            self.current_cell.send_keys("m")
        elif cell_type == "raw":
            self.current_cell.send_keys("r")
        elif cell_type == "code":
            self.current_cell.send_keys("y")
        else:
            raise CellTypeError(("{} is not a valid cell type,"
                                 "use 'code', 'markdown', or 'raw'").format(cell_type))
                                 
        self.wait_for_stale_cell(cell)
        self.focus_cell(index)
        return self.current_cell

    def wait_for_stale_cell(self, cell):
        """ This is needed to switch a cell's mode and refocus it, or to render it.

        Warning: there is currently no way to do this when changing between 
        markdown and raw cells.
        """
        wait = WebDriverWait(self.browser, 10)
        element = wait.until(EC.staleness_of(cell))

    def edit_cell(self, cell=None, index=0, content="", render=True):
        if cell is None:
            cell = self.cells[index]
        else:
            index = self.cells.index(cell)
        self.focus_cell(index)

        for line_no, line in enumerate(content.splitlines()):
            if line_no != 0:
                self.current_cell.send_keys(Keys.ENTER, "\n")
            self.current_cell.send_keys(Keys.ENTER, line)
        if render:
            self.execute_cell(self.current_cell_index)

    def execute_cell(self, index=0):
        self.focus_cell(index)
        self.current_cell.send_keys(Keys.CONTROL, Keys.ENTER)

    def add_cell(self, index=-1, cell_type="code"):
        self.focus_cell(index)
        self.current_cell.send_keys("a")
        new_index = index + 1 if index >= 0 else index
        self.convert_cell_type(index=new_index, cell_type=cell_type)

    def add_markdown_cell(self, index=-1, content="", render=True):
        self.add_cell(index, cell_type="markdown")
        self.edit_cell(index=index, content=content, render=render)
