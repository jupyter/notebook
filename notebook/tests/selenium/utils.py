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
