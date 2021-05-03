"""
store the current version info of the notebook.

"""
# Version string must appear intact for tbump versioning
__version__ = '6.5.0.dev0'

try:
    # When installing from a tarball, this import will not yet be available
    from jupyter_packaging import get_version_info
    version_info = get_version_info(__version__)
except ImportError:
    version_info = ()

# Downstream maintainer, when running `python.setup.py jsversion`,
# the version string is propagated to the JavaScript files,  do not forget to
# patch the JavaScript files in `.postN` release done by distributions.
