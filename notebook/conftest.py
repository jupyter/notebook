
import pytest

import sys

# TODO: Remove this hook once Issue #5967 is resolved.
def pytest_ignore_collect(path):
    if str(path).endswith("test_terminals_api.py"):
        if sys.platform.startswith('win') and sys.version_info >= (3, 9):
            return True  # do not collect
