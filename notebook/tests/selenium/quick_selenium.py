from selenium.webdriver import Firefox
from notebook.notebookapp import list_running_servers


def quick_driver(lab=False):
    """Quickly create a selenium driver pointing at an active noteboook server.

    Usage example:
    
        from notebook.tests.selenium.quick_selenium import quick_driver
        driver = quick_driver
        
    """
    try:
        server = list(list_running_servers())[0]
    except IndexError as e:
        e.message = 'You need a server running before you can run this command'
    driver = Firefox()
    auth_url = '{url}?token={token}'.format(**server)
    driver.get(auth_url)

    # If this redirects us to a lab page and we don't want that;
    # then we need to redirect ourselves to the classic notebook view
    if driver.current_url.endswith('/lab') and not lab:
        driver.get(driver.current_url.rstrip('lab')+'tree')
    return driver

