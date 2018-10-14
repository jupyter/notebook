'''
Test that the kernel disconnects and re-connects
when shutdown then restarted
'''

from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from notebook.tests.selenium.utils import wait_for_selector

kernel_menu_selector = '.dropdown:nth-child(5)'
menu_items = ['#restart_kernel', '#restart_clear_output', '#restart_run_all', '#shutdown_kernel']
notify_interaction = '#notification_kernel > span'

shutdown_selector = menu_items.pop()
confirm_selector = '.btn-danger'

def check_kernel_shutdown(notebook):
    browser = notebook.browser

    try:
        WebDriverWait(browser, 3).until(
                EC.text_to_be_present_in_element(
                    (By.CSS_SELECTOR, notify_interaction), 'No kernel'))
    except TimeoutException:
        return False
    return True

def check_kernel_restart(notebook):
    browser = notebook.browser

    try:
        WebDriverWait(browser, 3).until(
                EC.text_to_be_present_in_element(
                    (By.CSS_SELECTOR, notify_interaction), 'Kernel ready'))
    except TimeoutException:
        return False
    return True

def check_modal_still_open(notebook):
    '''
    The shutdown confirmation modal seems to briefly reappear
    after disappearing, then disappear for good.
    Selenium kept throwing errors for element not being clickable
    because it was obscured, even though we use WebDriverWait
    '''
    browser = notebook.browser
    return browser.find_elements_by_css_selector('.modal-backdrop')

def test_menu_items(notebook):
    browser = notebook.browser
    kernel_menu = browser.find_element_by_link_text('Kernel')

    for menu_item_selector in menu_items:
        WebDriverWait(browser, 3).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, kernel_menu_selector)))

        kernel_menu.click()
        browser.find_element_by_css_selector(shutdown_selector).click()

        wait_for_selector(browser, confirm_selector)
        browser.find_element_by_css_selector(confirm_selector).click()

        WebDriverWait(browser, 3).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, kernel_menu_selector)))

        while check_modal_still_open(notebook):
            pass

        assert check_kernel_shutdown(notebook)

        WebDriverWait(browser, 3).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, kernel_menu_selector)))

        kernel_menu.click()
        browser.find_element_by_css_selector(menu_item_selector).click()

        assert check_kernel_restart(notebook)