import pytest


@pytest.fixture
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


async def test_tree_handler(notebooks, jp_fetch):
    r = await jp_fetch("tree", "jlab_test_notebooks")
    assert r.code == 200

    # Check that the tree template is loaded
    html = r.body.decode()
    assert "- Tree</title>" in html
