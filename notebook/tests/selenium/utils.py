import os
import time
from selenium.webdriver import ActionChains
from selenium.webdriver.common.by import By
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.remote.webelement import WebElement

from contextlib import contextmanager

pjoin = os.path.join


def wait_for_selector(driver, selector, timeout=10, visible=False, single=False, wait_for_n=1):
    if wait_for_n > 1:
        return _wait_for_multiple(
            driver, By.CSS_SELECTOR, selector, timeout, wait_for_n, visible)
    return _wait_for(driver, By.CSS_SELECTOR, selector, timeout, visible, single)


def wait_for_tag(driver, tag, timeout=10, visible=False, single=False, wait_for_n=1):
    if wait_for_n > 1:
        return _wait_for_multiple(
            driver, By.TAG_NAME, tag, timeout, wait_for_n, visible)
    return _wait_for(driver, By.TAG_NAME, tag, timeout, visible, single)


def _wait_for(driver, locator_type, locator, timeout=10, visible=False, single=False):
    """Waits `timeout` seconds for the specified condition to be met. Condition is
    met if any matching element is found. Returns located element(s) when found.

    Args:
        driver: Selenium web driver instance
        locator_type: type of locator (e.g. By.CSS_SELECTOR or By.TAG_NAME)
        locator: name of tag, class, etc. to wait for
        timeout: how long to wait for presence/visibility of element
        visible: if True, require that element is not only present, but visible
        single: if True, return a single element, otherwise return a list of matching
        elements
    """
    wait = WebDriverWait(driver, timeout)
    if single:
        if visible:
            conditional = EC.visibility_of_element_located
        else:
            conditional = EC.presence_of_element_located
    else:
        if visible:
            conditional = EC.visibility_of_all_elements_located
        else:
            conditional = EC.presence_of_all_elements_located
    return wait.until(conditional((locator_type, locator)))


def _wait_for_multiple(driver, locator_type, locator, timeout, wait_for_n, visible=False):
    """Waits until `wait_for_n` matching elements to be present (or visible).
    Returns located elements when found.

    Args:
        driver: Selenium web driver instance
        locator_type: type of locator (e.g. By.CSS_SELECTOR or By.TAG_NAME)
        locator: name of tag, class, etc. to wait for
        timeout: how long to wait for presence/visibility of element
        wait_for_n: wait until this number of matching elements are present/visible
        visible: if True, require that elements are not only present, but visible
    """
    wait = WebDriverWait(driver, timeout)

    def multiple_found(driver):
        elements = driver.find_elements(locator_type, locator)
        if visible:
            elements = [e for e in elements if e.is_displayed()]
        if len(elements) < wait_for_n:
            return False
        return elements

    return wait.until(multiple_found)


class CellTypeError(ValueError):
    
    def __init__(self, message=""):
        self.message = message


class Notebook:
    
    def __init__(self, browser):
        self.browser = browser
        self.disable_autosave_and_onbeforeunload()
        
    def __len__(self):
        return len(self.cells)
        
    def __getitem__(self, key):
        return self.cells[key]
    
    def __setitem__(self, key, item):
        if isinstance(key, int):
            self.edit_cell(index=key, content=item, render=False)
        # TODO: re-add slicing support, handle general python slicing behaviour
        # includes: overwriting the entire self.cells object if you do 
        # self[:] = []
        # elif isinstance(key, slice):
        #     indices = (self.index(cell) for cell in self[key])
        #     for k, v in zip(indices, item):
        #         self.edit_cell(index=k, content=v, render=False)

    def __iter__(self):
        return (cell for cell in self.cells)

    @property
    def body(self):
        return self.browser.find_element_by_tag_name("body")

    @property
    def cells(self):
        """Gets all cells once they are visible.
        
        """
        return self.browser.find_elements_by_class_name("cell")
    
    @property
    def current_index(self):
        return self.index(self.current_cell)
    
    def index(self, cell):
        return self.cells.index(cell)

    def disable_autosave_and_onbeforeunload(self):
        """Disable request to save before closing window and autosave.
        
        This is most easily done by using js directly.
        """
        self.browser.execute_script("window.onbeforeunload = null;")
        self.browser.execute_script("Jupyter.notebook.set_autosave_interval(0)")

    def to_command_mode(self):
        """Changes us into command mode on currently focused cell
        
        """
        self.body.send_keys(Keys.ESCAPE)
        self.browser.execute_script("return Jupyter.notebook.handle_command_mode("
                                       "Jupyter.notebook.get_cell("
                                           "Jupyter.notebook.get_edit_index()))")

    def focus_cell(self, index=0):
        cell = self.cells[index]
        cell.click()
        self.to_command_mode()
        self.current_cell = cell
    
    def select_cell_range(self, initial_index=0, final_index=0):
        self.focus_cell(initial_index)
        self.to_command_mode()
        for i in range(final_index - initial_index):
            shift(self.browser, 'j')

    def find_and_replace(self, index=0, find_txt='', replace_txt=''):
        self.focus_cell(index)
        self.to_command_mode()
        self.body.send_keys('f')
        wait_for_selector(self.browser, "#find-and-replace", single=True)
        self.browser.find_element_by_id("findreplace_allcells_btn").click()
        self.browser.find_element_by_id("findreplace_find_inp").send_keys(find_txt)
        self.browser.find_element_by_id("findreplace_replace_inp").send_keys(replace_txt)
        self.browser.find_element_by_id("findreplace_replaceall_btn").click()

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

    def get_cells_contents(self):
        JS = 'return Jupyter.notebook.get_cells().map(function(c) {return c.get_text();})'
        return self.browser.execute_script(JS)

    def get_cell_contents(self, index=0, selector='div .CodeMirror-code'):
        return self.cells[index].find_element_by_css_selector(selector).text

    def set_cell_metadata(self, index, key, value):
        JS = 'Jupyter.notebook.get_cell({}).metadata.{} = {}'.format(index, key, value)
        return self.browser.execute_script(JS)

    def get_cell_type(self, index=0):
        JS = 'return Jupyter.notebook.get_cell({}).cell_type'.format(index)
        return self.browser.execute_script(JS)
        
    def set_cell_input_prompt(self, index, prmpt_val):
        JS = 'Jupyter.notebook.get_cell({}).set_input_prompt({})'.format(index, prmpt_val)
        self.browser.execute_script(JS)

    def edit_cell(self, cell=None, index=0, content="", render=False):
        """Set the contents of a cell to *content*, by cell object or by index
        """
        if cell is not None:
            index = self.index(cell)
        self.focus_cell(index)

        # Select & delete anything already in the cell
        self.current_cell.send_keys(Keys.ENTER)
        ctrl(self.browser, 'a')
        self.current_cell.send_keys(Keys.DELETE)

        for line_no, line in enumerate(content.splitlines()):
            if line_no != 0:
                self.current_cell.send_keys(Keys.ENTER, "\n")
            self.current_cell.send_keys(Keys.ENTER, line)
        if render:
            self.execute_cell(self.current_index)

    def execute_cell(self, cell_or_index=None):
        if isinstance(cell_or_index, int):
            index = cell_or_index
        elif isinstance(cell_or_index, WebElement): 
            index = self.index(cell_or_index)
        else:
            raise TypeError("execute_cell only accepts a WebElement or an int")
        self.focus_cell(index)
        self.current_cell.send_keys(Keys.CONTROL, Keys.ENTER)

    def add_cell(self, index=-1, cell_type="code", content=""):
        self.focus_cell(index)
        self.current_cell.send_keys("b")
        new_index = index + 1 if index >= 0 else index
        if content:
            self.edit_cell(index=index, content=content)
        if cell_type != 'code':
            self.convert_cell_type(index=new_index, cell_type=cell_type)

    def add_and_execute_cell(self, index=-1, cell_type="code", content=""):
        self.add_cell(index=index, cell_type=cell_type, content=content)
        self.execute_cell(index)

    def delete_cell(self, index):
        self.focus_cell(index)
        self.to_command_mode()
        self.current_cell.send_keys('dd')

    def add_markdown_cell(self, index=-1, content="", render=True):
        self.add_cell(index, cell_type="markdown")
        self.edit_cell(index=index, content=content, render=render)
    
    def append(self, *values, cell_type="code"):
        for i, value in enumerate(values):
            if isinstance(value, str):
                self.add_cell(cell_type=cell_type,
                              content=value)
            else:
                raise TypeError("Don't know how to add cell from %r" % value)
    
    def extend(self, values):
        self.append(*values)
    
    def run_all(self):
        for cell in self:
            self.execute_cell(cell)

    def trigger_keydown(self, keys):
        trigger_keystrokes(self.body, keys)

    @classmethod
    def new_notebook(cls, browser, kernel_name='kernel-python3'):
        with new_window(browser, selector=".cell"):
            select_kernel(browser, kernel_name=kernel_name)
        return cls(browser)

    
def select_kernel(browser, kernel_name='kernel-python3'):
    """Clicks the "new" button and selects a kernel from the options.
    """
    wait = WebDriverWait(browser, 10)
    new_button = wait.until(EC.element_to_be_clickable((By.ID, "new-dropdown-button")))
    new_button.click()
    kernel_selector = '#{} a'.format(kernel_name)
    kernel = wait_for_selector(browser, kernel_selector, single=True)
    kernel.click()

@contextmanager
def new_window(browser, selector=None):
    """Contextmanager for switching to & waiting for a window created. 
    
    This context manager gives you the ability to create a new window inside 
    the created context and it will switch you to that new window.
    
    If you know a CSS selector that can be expected to appear on the window, 
    then this utility can wait on that selector appearing on the page before
    releasing the context.
    
    Usage example:
    
        from notebook.tests.selenium.utils import new_window, Notebook
        
        ⋮ # something that creates a browser object
        
        with new_window(browser, selector=".cell"):
            select_kernel(browser, kernel_name=kernel_name)
        nb = Notebook(browser)

    """
    initial_window_handles = browser.window_handles
    yield
    new_window_handle = next(window for window in browser.window_handles 
                             if window not in initial_window_handles)
    browser.switch_to.window(new_window_handle)
    if selector is not None:
        wait_for_selector(browser, selector)

def shift(browser, k):
    """Send key combination Shift+(k)"""
    trigger_keystrokes(browser, "shift-%s"%k)

def ctrl(browser, k):
    """Send key combination Ctrl+(k)"""
    trigger_keystrokes(browser, "control-%s"%k)

def trigger_keystrokes(browser, *keys):
    """ Send the keys in sequence to the browser.
    Handles following key combinations
    1. with modifiers eg. 'control-alt-a', 'shift-c'
    2. just modifiers eg. 'alt', 'esc'
    3. non-modifiers eg. 'abc'
    Modifiers : http://seleniumhq.github.io/selenium/docs/api/py/webdriver/selenium.webdriver.common.keys.html
    """
    for each_key_combination in keys:
        keys = each_key_combination.split('-')
        if len(keys) > 1:  # key has modifiers eg. control, alt, shift
            modifiers_keys = [getattr(Keys, x.upper()) for x in keys[:-1]]
            ac = ActionChains(browser)
            for i in modifiers_keys: ac = ac.key_down(i)
            ac.send_keys(keys[-1])
            for i in modifiers_keys[::-1]: ac = ac.key_up(i)
            ac.perform()
        else:              # single key stroke. Check if modifier eg. "up"
            browser.send_keys(getattr(Keys, keys[0].upper(), keys[0]))
