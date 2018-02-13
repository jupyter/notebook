import os

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

pjoin = os.path.join

def get_list_items(browser):
    return [{
        'link': a.get_attribute('href'),
        'label': a.find_element_by_class_name('item_name').text,
    } for a in browser.find_elements_by_class_name('item_link')]


def wait_for_selector(browser, selector, timeout=10):
    wait = WebDriverWait(browser, timeout)
    return wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, selector)))



def test_items(browser, visited=None):
    tree_root_url = browser.current_url
    if visited is None:
        visited = set()

    wait_for_selector(browser, '.item_link')
    items = get_list_items(browser)
    print(browser.current_url, len(items))
    for item in items:
        print(item)
        url = item['link']
        if url.startswith(tree_root_url):
            print("Going to", url)
            if url in visited:
                continue
            visited.add(url)
            browser.get(url)
            wait_for_selector(browser, '.item_link')
            assert browser.current_url == url

            test_items(browser, visited)
            #browser.back()

    print()
