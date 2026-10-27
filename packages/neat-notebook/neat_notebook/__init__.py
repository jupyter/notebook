"""Neat Notebook prebuilt frontend extension; no server or kernel plugin."""

from ._version import __version__

__all__ = ["__version__", "_jupyter_labextension_paths"]


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "neat-notebook"}]
