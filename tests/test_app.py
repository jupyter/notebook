import os

import pytest
from tornado.httpclient import HTTPClientError

from notebook.app import JupyterNotebookApp, NotebookHandler, TreeHandler


@pytest.fixture()
def notebooks(jp_create_notebook, notebookapp):
    nbpaths = (
        "notebook1.ipynb",
        "jlab_test_notebooks/notebook2.ipynb",
        "jlab_test_notebooks/level2/notebook3.ipynb",
    )
    for nb in nbpaths:
        jp_create_notebook(nb)
    return nbpaths


async def test_notebook_handler(notebooks, jp_fetch):
    for nbpath in notebooks:
        r = await jp_fetch("/", nbpath)
        assert r.code == 200
        # Check that the lab template is loaded
        html = r.body.decode()
        assert "Jupyter Notebook" in html

        r = await jp_fetch("/notebooks", nbpath)
        assert r.code == 200
        # Check that the lab template is loaded
        html = r.body.decode()
        assert "Jupyter Notebook" in html

    redirected_url = None

    def redirect(self, url):
        nonlocal redirected_url
        redirected_url = url

    NotebookHandler.redirect = redirect
    await jp_fetch("notebooks", "jlab_test_notebooks")
    assert redirected_url == "/a%40b/tree/jlab_test_notebooks"


async def test_tree_handler(notebooks, notebookapp, jp_fetch):
    app: JupyterNotebookApp = notebookapp
    r = await jp_fetch("tree", "jlab_test_notebooks")
    assert r.code == 200

    # Check that the tree template is loaded
    html = r.body.decode()
    assert "<title>Home</title>" in html

    redirected_url = None

    def redirect(self, url):
        nonlocal redirected_url
        redirected_url = url

    TreeHandler.redirect = redirect
    await jp_fetch("tree", "notebook1.ipynb")
    assert redirected_url == "/a%40b/notebooks/notebook1.ipynb"

    with open(os.path.join(app.serverapp.root_dir, "foo.txt"), "w") as fid:
        fid.write("hello")

    await jp_fetch("tree", "foo.txt")
    assert redirected_url == "/a%40b/files/foo.txt"

    with pytest.raises(HTTPClientError):
        await jp_fetch("tree", "does_not_exist.ipynb")


async def test_console_handler(notebookapp, jp_fetch):
    r = await jp_fetch("consoles", "foo")
    assert r.code == 200
    html = r.body.decode()
    assert "- Console</title>" in html


async def test_terminals_handler(notebookapp, jp_fetch):
    r = await jp_fetch("terminals", "foo")
    assert r.code == 200
    html = r.body.decode()
    assert "- Terminal</title>" in html


async def test_edit_handler(notebooks, jp_fetch):
    r = await jp_fetch("edit", "notebook1.ipynb")
    assert r.code == 200
    html = r.body.decode()
    assert "- Edit</title>" in html


async def test_app(notebookapp):
    app: JupyterNotebookApp = notebookapp
    assert app.static_dir
    assert app.templates_dir
    assert app.app_settings_dir
    assert app.schemas_dir
    assert app.user_settings_dir
    assert app.workspaces_dir
