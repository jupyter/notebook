import os

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
pjoin = os.path.join

def get_list_items(browser):
    return [{
        'link': a.get_attribute('href'),
        'label': a.find_element_by_class_name('item_name').text,
        'element': a,
    } for a in browser.find_elements_by_class_name('item_link')]


def wait_for_selector(browser, selector, timeout=10):
    wait = WebDriverWait(browser, timeout)
    return wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, selector)))

def test_items(authenticated_browser):
    tree_root_url = authenticated_browser.current_url
    visited_dict = {}
    # Going down the tree to collect links
    while True:
        wait_for_selector(authenticated_browser, '.item_link')
        items = get_list_items(authenticated_browser)
        visited_dict[authenticated_browser.current_url] = items
        print(authenticated_browser.current_url, len(items))
        if len(items)>1:
            item = items[1]
            url = item['link']
            item["element"].click()
            assert authenticated_browser.current_url == url
        else:
            break
    # Going back up the tree while we still have unvisited links
    while visited_dict:
        wait_for_selector(authenticated_browser, '.item_link')
        current_items = get_list_items(authenticated_browser)
        current_items_links = [item["link"] for item in current_items]
        stored_items = visited_dict.pop(authenticated_browser.current_url)
        stored_items_links = [item["link"] for item in stored_items]
        assert stored_items_links == current_items_links
        authenticated_browser.back()
