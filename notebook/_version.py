"""
store the current version info of the notebook.

"""
import re

# Next beta (b)/ alpha (a)/ release candidate (rc) release: The version number for alpha is X.Y.ZaN
__version__ = '5.7.14a0'

# Build up version_info tuple for backwards compatibility
pattern = r'(?P<major>\d+).(?P<minor>\d+).(?P<patch>\d+)(?P<rest>.*)'
match = re.match(pattern, __version__)
parts = [int(match[part]) for part in ['major', 'minor', 'patch']]
if match['rest']:
    parts.append(match['rest'])
version_info = tuple(parts)
