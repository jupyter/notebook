from selenium.webdriver import Firefox
from notebook.notebookapp import list_running_servers


def quick_driver():
    """Quickly create a selenium driver pointing at an active noteboook server.

    """
    try:
        server = list(list_running_servers())[0]
    except IndexError as e:
        e.message = 'You need a server running before you can run this command'
    driver = Firefox()
    auth_url = f'{server["url"]}?token={server["token"]}'
    driver.get(auth_url)
    return driver
