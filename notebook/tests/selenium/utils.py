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

class Notebook:
    
    def __init__(self, browser):
        self.browser = browser
        
    @property
    def body(self):
        return self.browser.find_element_by_tag_name("body")
        
    @property
    def cells(self):
        return self.browser.find_elements_by_class_name("cell")

    def to_command_mode(self):
        """Changes us into command mode on currently focused cell
        """
        self.browser.switch_to.active_element.send_keys(Keys.ESCAPE)
        self.browser.execute_script("return Jupyter.notebook.handle_command_mode("
                                       "Jupyter.notebook.get_cell("
                                           "Jupyter.notebook.get_edit_index()))")

    @property
    def current_cell_index(self):
        return self.cells.index(self.current_cell)

    def focus_cell(self, index=0, edit=False):
        cell = self.cells[index]
        cell.click()
        if not edit:
            self.to_command_mode()
        self.current_cell = cell
