def test_safe_append_output(Notebook):
    driver = Notebook.broswer

    # set and execute cell 0
    Notebook.edit_cell(index=0, content="dp = get_ipython().display_pub\n" +
                       "dp.publish({'text/plain' : '5', 'image/png' : 5})")
    Notebook.execute_cell(0)
    out = Notebook.get_cell_output(0)

    assert out == "5", "Text data is fine and non-string png data was stripped"

    # firefox doesn't provide access to javascript errors
    browserlogs = driver.get_log('browser')

    found = False
    for entry in browserlogs:
        if entry['message'] == 'Invalid type for image/png 5':
            found = True
            break

    assert found, "Logged Invalid type message"
