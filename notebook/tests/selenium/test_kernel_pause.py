import time
from notebook.tests.selenium.utils import wait_for_selector

def select_kernel_option(notebook, element_id):
    wait_for_selector(notebook.browser, "#kernel_menu_main", clickable=True)
    ele = notebook.browser.find_element_by_id("kernel_menu_main")
    ele.click()
    wait_for_selector(notebook.browser, "#%s"%element_id, clickable=True)
    ele = notebook.browser.find_element_by_id("%s"%element_id)
    ele.click()

def display_status_for_option(notebook, koption):
    """Checks if "pause" option appears in the kernel menu """
    wait_for_selector(notebook.browser, "#kernel_menu_main", clickable=True)
    menubar = notebook.browser.find_element_by_id("kernel_menu_main")
    option_element = menubar.find_element_by_id(koption)
    return option_element.is_displayed()

def pause_kernel(notebook):
    select_kernel_option(notebook, "suspend_kernel")
    time.sleep(5)  # give some time from kernel to receive SIGSTOP - came up with 5 seconds after repeated experiments

def resume_kernel(notebook):
    select_kernel_option(notebook, "resume_kernel")
    time.sleep(5)  # give some time from kernel to receive SIGCONT - came up with 5 seconds after repeated experiments

def pause_kernel_option_displayed(notebook):
    return display_status_for_option(notebook, 'suspend_kernel')

def resume_kernel_option_displayed(notebook):
    return display_status_for_option(notebook, 'resume_kernel')

def capture_output(notebook, cell=0):
    cell_output = notebook.get_cell_output(cell)
    if len(cell_output) >= 1:
        return cell_output[0]["text"].strip()
    else:
        return None

def kernel_notification(notebook):
    notification = notebook.browser.find_element_by_id("notification_kernel")
    if notification:
        return notification.text.strip()
    else:
        return None

def test_kernel_pause(notebook):
    """ test kernel pause feature of notebook """
    cell_content = """
for i in range(1,100000): print (i)
"""
    notebook.add_cell(index=0, content=cell_content);
    notebook.execute_cell(0)
    # pause the kernel
    pause_kernel(notebook)
    # capture outputs one by one and compare
    last_output1 = capture_output(notebook)
    last_output2 = capture_output(notebook)
    assert last_output1 == last_output2                      # Test -  output hasn't changed after pausing the kernel
    # kernel should be paused now. Check kernel notification bar
    assert kernel_notification(notebook) == "kernel paused"  # Test -  kernel notification has "kernel paused" text
    # pause option should get hidden now
    assert pause_kernel_option_displayed(notebook) == False  # Test -  "pause" option doesn't show in kernel dropdown
    # resume the kernel now
    resume_kernel(notebook)
    # since the loop is resumed, current output should be different than last output
    current_output = capture_output(notebook)
    assert last_output2 != current_output                    # Test -  current output has changed after resuming
    assert resume_kernel_option_displayed(notebook) == False # Test -  "resume" option doesn't show in kernel dropdown

