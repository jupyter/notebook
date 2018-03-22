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


def only_dir_links(browser):
    try:
        assert 'tree' in browser.current_url
    except AssertionError:
        raise("You currently ")
    wait_for_selector(browser, '.item_link')
    items = get_list_items(browser)
    return [i for i in items if 'tree' in i['link'] and i['label'] != '..']


def wait_for_selector(browser, selector, timeout=10):
    wait = WebDriverWait(browser, timeout)
    return wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, selector)))


def test_items(authenticated_browser):
    tree_root_url = authenticated_browser.current_url
    visited_dict = {}
    # Going down the tree to collect links
    while True:
        wait_for_selector(authenticated_browser, '.item_link')
        current_url = authenticated_browser.current_url
        items = visited_dict[current_url] = only_dir_links(authenticated_browser)
        try: 
            item = items[0]
            text, url = (item['label'], item['link'])
            item["element"].click()
            assert authenticated_browser.current_url == url
        except IndexError:
            break
    # Going back up the tree while we still have unvisited links
    while visited_dict:
        wait_for_selector(authenticated_browser, '.item_link')
        current_items = only_dir_links(authenticated_browser)
        current_items_links = [item["link"] for item in current_items]
        stored_items = visited_dict.pop(authenticated_browser.current_url)
        stored_items_links = [item["link"] for item in stored_items]
        assert stored_items_links == current_items_links
        authenticated_browser.back()

