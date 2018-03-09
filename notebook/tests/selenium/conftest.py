import json
import os
import pytest
import requests
from subprocess import Popen
import sys
from testpath.tempdir import TemporaryDirectory
import time
from urllib.parse import urljoin

from selenium.webdriver import Firefox, Remote, Chrome

pjoin = os.path.join

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
                   '--NotebookApp.base_url=/a@b/',
                  ]
        print("command=", command)
        proc = info['popen'] = Popen(command, cwd=nbdir, env=env)
        info_file_path = pjoin(td, 'jupyter_runtime', 'nbserver-%i.json' % proc.pid)
        info.update(_wait_for_server(proc, info_file_path))

        print("Notebook server info:", info)
        yield info

    # Shut the server down
    requests.post(urljoin(info['url'], 'api/shutdown'),
                  headers={'Authorization': 'token '+info['token']})

@pytest.fixture(scope='session')
def selenium_driver():
    if os.environ.get('SAUCE_USERNAME'):
        username = os.environ["SAUCE_USERNAME"]
        access_key = os.environ["SAUCE_ACCESS_KEY"]
        capabilities = {
            "tunnel-identifier": os.environ["TRAVIS_JOB_NUMBER"],
            "build": os.environ["TRAVIS_BUILD_NUMBER"],
            "tags": [os.environ['TRAVIS_PYTHON_VERSION'], 'CI'],
            "platform": "Windows 10",
            "browserName": os.environ['JUPYTER_TEST_BROWSER'],
            "version": "latest",
        }
        if capabilities['browserName'] == 'firefox':
            # Attempt to work around issue where browser loses authentication
            capabilities['version'] = '57.0'
        hub_url = "%s:%s@localhost:4445" % (username, access_key)
        print("Connecting remote driver on Sauce Labs")
        driver = Remote(desired_capabilities=capabilities,
                      command_executor="http://%s/wd/hub" % hub_url)
    elif os.environ.get('JUPYTER_TEST_BROWSER') == 'chrome':
        driver = Chrome()
    else:
        driver = Firefox()

    yield driver

    # Teardown
    driver.quit()

@pytest.fixture
def authenticated_browser(selenium_driver, notebook_server):
    selenium_driver.get("{url}?token={token}".format(**notebook_server))
    return selenium_driver
