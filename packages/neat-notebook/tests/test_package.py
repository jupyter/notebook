"""Validate the installed prebuilt distribution, rather than development links."""

import json
from importlib.metadata import distribution
from pathlib import Path

import neat_notebook
from packaging.requirements import Requirement


def test_version():
    assert neat_notebook.__version__ == distribution("neat-notebook").version == "0.1.2"


def test_supported_host_dependencies():
    requirements = {
        requirement.name: requirement
        for value in distribution("neat-notebook").requires or []
        if (requirement := Requirement(value)).name in {"jupyterlab", "notebook"}
    }
    lab = requirements["jupyterlab"]
    assert lab.marker is None
    assert "4.5.7" in lab.specifier
    assert "4.6.4" in lab.specifier
    assert "5.0.0" not in lab.specifier
    notebook = requirements["notebook"]
    assert notebook.marker is not None
    assert notebook.marker.evaluate({"extra": "notebook"})
    assert not notebook.marker.evaluate({"extra": ""})
    assert "7.5.6" in notebook.specifier
    assert "7.6.3" in notebook.specifier
    assert "8.0.0" not in notebook.specifier


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
