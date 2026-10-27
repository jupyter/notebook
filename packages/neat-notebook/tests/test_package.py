"""Validate the installed prebuilt distribution, rather than development links."""

import json
from importlib.metadata import distribution
from pathlib import Path

import neat_notebook


def test_version():
    assert neat_notebook.__version__ == distribution("neat-notebook").version == "0.1.0"


def test_discovery():
    assert neat_notebook._jupyter_labextension_paths() == [
        {"src": "labextension", "dest": "neat-notebook"}
    ]


def test_frontend_assets():
    dist = distribution("neat-notebook")
    files = list(dist.files or [])
    package = next(
        path for path in files if str(path).endswith("labextensions/neat-notebook/package.json")
    )
    root = Path(dist.locate_file(package)).parent
    metadata = json.loads((root / "package.json").read_text())
    assert metadata["name"] == "neat-notebook"
    assert metadata["version"] == neat_notebook.__version__
    assert (root / metadata["jupyterlab"]["_build"]["load"]).is_file()
    assert (root / "static/style.js").is_file()
    schema = json.loads((root / "schemas/neat-notebook/cell-inspector.json").read_text())
    assert schema["properties"]["enabled"]["default"] is True
    install = json.loads((root / "install.json").read_text())
    assert install["packageName"] == "neat-notebook"


def test_singleton_dependencies_and_duplicate_prevention():
    dist = distribution("neat-notebook")
    package = next(
        path
        for path in dist.files or []
        if str(path).endswith("labextensions/neat-notebook/package.json")
    )
    metadata = json.loads(Path(dist.locate_file(package)).read_text())
    assert metadata["jupyterlab"]["disabledExtensions"] == [
        "@jupyter-notebook/notebook-extension:cell-inspector"
    ]
    for dependency in metadata["jupyterlab"]["sharedPackages"].values():
        assert dependency == {"singleton": True, "bundled": False}
