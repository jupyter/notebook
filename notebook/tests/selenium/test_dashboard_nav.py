import binascii
import json
import os
import pytest
import requests
from subprocess import Popen
import sys
from testpath.tempdir import TemporaryDirectory
import time
from urllib.parse import urljoin

from selenium.webdriver import Firefox, Remote
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

def _wait_for_server(proc, info_file_path):
    """Wait 30 seconds for the notebook server to start"""
    for i in range(300):
        if proc.poll() is not None:
            raise RuntimeError("Notebook server failed to start")
        if os.path.exists(info_file_path):
            try:
                with open(info_file_path) as f:
                    return json.load(f)
            except ValueError:
                # If the server is halfway through writing the file, we may
                # get invalid JSON; it should be ready next iteration.
                pass
        time.sleep(0.1)
    raise RuntimeError("Didn't find %s in 30 seconds", info_file_path)

@pytest.fixture(scope='session')
def notebook_server():
    info = {}
    with TemporaryDirectory() as td:
        nbdir = info['nbdir'] = pjoin(td, 'notebooks')
        os.makedirs(pjoin(nbdir, u'sub ∂ir1', u'sub ∂ir 1a'))
        os.makedirs(pjoin(nbdir, u'sub ∂ir2', u'sub ∂ir 1b'))

        info['extra_env'] = {
            'JUPYTER_CONFIG_DIR': pjoin(td, 'jupyter_config'),
            'JUPYTER_RUNTIME_DIR': pjoin(td, 'jupyter_runtime'),
            'IPYTHONDIR': pjoin(td, 'ipython'),
        }
        env = os.environ.copy()
        env.update(info['extra_env'])

        command = [sys.executable, '-m', 'notebook',
                   '--no-browser',
                   '--notebook-dir', nbdir,
                   # run with a base URL that would be escaped,
                   # to test that we don't double-escape URLs
                   '--NotebookApp.base_url', '/a@b/',
                  ]
        print("command=", command)
        proc = info['popen'] = Popen(command, env=env)
        info_file_path = pjoin(td, 'jupyter_runtime', 'nbserver-%i.json' % proc.pid)
        info.update(_wait_for_server(proc, info_file_path))

        print("Notebook server info:", info)
        yield info

    # Shut the server down
    requests.post(urljoin(info['url'], 'api/shutdown'),
                  headers={'Authorization': 'token '+info['token']})


def _get_selenium_driver():
    if os.environ.get('TRAVIS'):
        username = os.environ["SAUCE_USERNAME"]
        access_key = os.environ["SAUCE_ACCESS_KEY"]
        capabilities = {
            "tunnel-identifier": os.environ["TRAVIS_JOB_NUMBER"],
            "build": os.environ["TRAVIS_BUILD_NUMBER"],
            "tags": [os.environ['TRAVIS_PYTHON_VERSION'], 'CI'],
        }
        hub_url = "%s:%s@localhost:4445" % (username, access_key)
        return Remote(desired_capabilities=capabilities,
                      command_executor="https://%s/wd/hub" % hub_url)
    else:
        return Firefox()

@pytest.fixture
def browser(notebook_server):
    b = _get_selenium_driver()
    b.get("{url}?token={token}".format(**notebook_server))
    yield b
    b.quit()

def test_items(browser, visited=None):
    base_url = 'http://localhost:8888/'  # TODO
    if visited is None:
        visited = set()

    wait_for_selector(browser, '.item_link')
    items = get_list_items(browser)
    print(browser, len(items))
    print(items)
    time.sleep(1)
    items = get_list_items(browser)
    print(len(items))
    print(items)
    for item in items:
        url = item['link']
        if url.startswith(urljoin(base_url, 'tree')):
            print("Going to", url)
            if url in visited:
                continue
            visited.add(url)
            browser.get(url)
            wait_for_selector(browser, '.item_link')
            assert browser.current_url == url

            test_items(browser, visited)
            browser.back()

#    assert False
