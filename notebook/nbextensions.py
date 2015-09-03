# coding: utf-8
"""Utilities for installing Javascript extensions for the notebook"""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from __future__ import print_function

import os
import shutil
import sys
import tarfile
import zipfile
from os.path import basename, join as pjoin

try:
    from urllib.parse import urlparse  # Py3
    from urllib.request import urlretrieve
except ImportError:
    from urlparse import urlparse
    from urllib import urlretrieve

from jupyter_core.paths import jupyter_data_dir, jupyter_path, SYSTEM_JUPYTER_PATH
from ipython_genutils.path import ensure_dir_exists
from ipython_genutils.py3compat import string_types, cast_unicode_py2
from ipython_genutils.tempdir import TemporaryDirectory
from ._version import __version__

class ArgumentConflict(ValueError):
    pass


def _should_copy(src, dest, verbose=1):
    """should a file be copied?"""
    if not os.path.exists(dest):
        return True
    if os.stat(src).st_mtime - os.stat(dest).st_mtime > 1e-6:
        # we add a fudge factor to work around a bug in python 2.x
        # that was fixed in python 3.x: http://bugs.python.org/issue12904
        if verbose >= 2:
            print("%s is out of date" % dest)
        return True
    if verbose >= 2:
        print("%s is up to date" % dest)
    return False


def _maybe_copy(src, dest, verbose=1):
    """copy a file if it needs updating"""
    if _should_copy(src, dest, verbose):
        if verbose >= 1:
            print("copying %s -> %s" % (src, dest))
        shutil.copy2(src, dest)

def _safe_is_tarfile(path):
    """safe version of is_tarfile, return False on IOError"""
    try:
        return tarfile.is_tarfile(path)
    except IOError:
        return False


def _get_nbext_dir(nbextensions_dir=None, user=False, prefix=None):
    """Return the nbextension directory specified"""
    if sum(map(bool, [user, prefix, nbextensions_dir])) > 1:
        raise ArgumentConflict("Cannot specify more than one of user, prefix, or nbextensions_dir.")
    if user:
        nbext = pjoin(jupyter_data_dir(), u'nbextensions')
    else:
        if prefix:
            nbext = pjoin(prefix, 'share', 'jupyter', 'nbextensions')
        elif nbextensions_dir:
            nbext = nbextensions_dir
        else:
            nbext = pjoin(SYSTEM_JUPYTER_PATH[0], 'nbextensions')
    return nbext


def check_nbextension(files, user=False, prefix=None, nbextensions_dir=None):
    """Check whether nbextension files have been installed
    
    Returns True if all files are found, False if any are missing.

    Parameters
    ----------

    files : list(paths)
        a list of relative paths within nbextensions.
    user : bool [default: False]
        Whether to check the user's .ipython/nbextensions directory.
        Otherwise check a system-wide install (e.g. /usr/local/share/jupyter/nbextensions).
    prefix : str [optional]
        Specify install prefix, if it should differ from default (e.g. /usr/local).
        Will check prefix/share/jupyter/nbextensions
    nbextensions_dir : str [optional]
        Specify absolute path of nbextensions directory explicitly.
    """
    nbext = _get_nbext_dir(nbextensions_dir, user, prefix)
    # make sure nbextensions dir exists
    if not os.path.exists(nbext):
        return False
    
    if isinstance(files, string_types):
        # one file given, turn it into a list
        files = [files]
    
    return all(os.path.exists(pjoin(nbext, f)) for f in files)


def install_nbextension(path, overwrite=False, symlink=False, user=False, prefix=None, nbextensions_dir=None, destination=None, verbose=1):
    """Install a Javascript extension for the notebook
    
    Stages files and/or directories into the nbextensions directory.
    By default, this compares modification time, and only stages files that need updating.
    If `overwrite` is specified, matching files are purged before proceeding.
    
    Parameters
    ----------
    
    path : path to file, directory, zip or tarball archive, or URL to install
        By default, the file will be installed with its base name, so '/path/to/foo'
        will install to 'nbextensions/foo'. See the destination argument below to change this.
        Archives (zip or tarballs) will be extracted into the nbextensions directory.
    overwrite : bool [default: False]
        If True, always install the files, regardless of what may already be installed.
    symlink : bool [default: False]
        If True, create a symlink in nbextensions, rather than copying files.
        Not allowed with URLs or archives. Windows support for symlinks requires
        Vista or above, Python 3, and a permission bit which only admin users
        have by default, so don't rely on it.
    user : bool [default: False]
        Whether to install to the user's nbextensions directory.
        Otherwise do a system-wide install (e.g. /usr/local/share/jupyter/nbextensions).
    prefix : str [optional]
        Specify install prefix, if it should differ from default (e.g. /usr/local).
        Will install to ``<prefix>/share/jupyter/nbextensions``
    nbextensions_dir : str [optional]
        Specify absolute path of nbextensions directory explicitly.
    destination : str [optional]
        name the nbextension is installed to.  For example, if destination is 'foo', then
        the source file will be installed to 'nbextensions/foo', regardless of the source name.
        This cannot be specified if an archive is given as the source.
    verbose : int [default: 1]
        Set verbosity level. The default is 1, where file actions are printed.
        set verbose=2 for more output, or verbose=0 for silence.
    """
    nbext = _get_nbext_dir(nbextensions_dir, user, prefix)
    # make sure nbextensions dir exists
    ensure_dir_exists(nbext)
    
    # forcing symlink parameter to False if os.symlink does not exist (e.g., on Windows machines running python 2)
    if not hasattr(os, 'symlink'):
        symlink = False
    
    if isinstance(path, (list, tuple)):
        raise TypeError("path must be a string pointing to a single extension to install; call this function multiple times to install multiple extensions")
    
    path = cast_unicode_py2(path)

    if path.startswith(('https://', 'http://')):
        if symlink:
            raise ValueError("Cannot symlink from URLs")
        # Given a URL, download it
        with TemporaryDirectory() as td:
            filename = urlparse(path).path.split('/')[-1]
            local_path = os.path.join(td, filename)
            if verbose >= 1:
                print("downloading %s to %s" % (path, local_path))
            urlretrieve(path, local_path)
            # now install from the local copy
            install_nbextension(local_path, overwrite=overwrite, symlink=symlink, nbextensions_dir=nbext, destination=destination, verbose=verbose)
    elif path.endswith('.zip') or _safe_is_tarfile(path):
        if symlink:
            raise ValueError("Cannot symlink from archives")
        if destination:
            raise ValueError("Cannot give destination for archives")
        if verbose >= 1:
            print("extracting %s to %s" % (path, nbext))

        if path.endswith('.zip'):
            archive = zipfile.ZipFile(path)
        elif _safe_is_tarfile(path):
            archive = tarfile.open(path)
        archive.extractall(nbext)
        archive.close()
    else:
        if not destination:
            destination = basename(path)
        destination = cast_unicode_py2(destination)
        full_dest = pjoin(nbext, destination)
        if overwrite and os.path.lexists(full_dest):
            if verbose >= 1:
                print("removing %s" % full_dest)
            if os.path.isdir(full_dest) and not os.path.islink(full_dest):
                shutil.rmtree(full_dest)
            else:
                os.remove(full_dest)

        if symlink:
            path = os.path.abspath(path)
            if not os.path.exists(full_dest):
                if verbose >= 1:
                    print("symlink %s -> %s" % (full_dest, path))
                os.symlink(path, full_dest)
        elif os.path.isdir(path):
            path = pjoin(os.path.abspath(path), '') # end in path separator
            for parent, dirs, files in os.walk(path):
                dest_dir = pjoin(full_dest, parent[len(path):])
                if not os.path.exists(dest_dir):
                    if verbose >= 2:
                        print("making directory %s" % dest_dir)
                    os.makedirs(dest_dir)
                for file in files:
                    src = pjoin(parent, file)
                    # print("%r, %r" % (dest_dir, file))
                    dest_file = pjoin(dest_dir, file)
                    _maybe_copy(src, dest_file, verbose)
        else:
            src = path
            _maybe_copy(src, full_dest, verbose)

#----------------------------------------------------------------------
# install nbextension app
#----------------------------------------------------------------------

from traitlets import Bool, Enum, Unicode
from jupyter_core.application import JupyterApp

flags = {
    "overwrite" : ({
        "InstallNBExtensionApp" : {
            "overwrite" : True,
        }}, "Force overwrite of existing files"
    ),
    "debug" : ({
        "InstallNBExtensionApp" : {
            "verbose" : 2,
        }}, "Extra output"
    ),
    "quiet" : ({
        "InstallNBExtensionApp" : {
            "verbose" : 0,
        }}, "Minimal output"
    ),
    "symlink" : ({
        "InstallNBExtensionApp" : {
            "symlink" : True,
        }}, "Create symlink instead of copying files"
    ),
    "user" : ({
        "InstallNBExtensionApp" : {
            "user" : True,
        }}, "Install to the user's IPython directory"
    ),
}
flags['s'] = flags['symlink']

aliases = {
    "prefix" : "InstallNBExtensionApp.prefix",
    "nbextensions" : "InstallNBExtensionApp.nbextensions_dir",
    "destination" : "InstallNBExtensionApp.destination",
}

class InstallNBExtensionApp(JupyterApp):
    """Entry point for installing notebook extensions"""
    version = __version__
    description = """Install Jupyter notebook extensions
    
    Usage
    
        jupyter nbextension install path/url
    
    This copies a file or a folder into the Jupyter nbextensions directory.
    If a URL is given, it will be downloaded.
    If an archive is given, it will be extracted into nbextensions.
    If the requested files are already up to date, no action is taken
    unless --overwrite is specified.
    """
    
    examples = """
    jupyter nbextension install /path/to/myextension
    """
    aliases = aliases
    flags = flags
    
    overwrite = Bool(False, config=True, help="Force overwrite of existing files")
    symlink = Bool(False, config=True, help="Create symlinks instead of copying files")
    user = Bool(False, config=True, help="Whether to do a user install")
    prefix = Unicode('', config=True, help="Installation prefix")
    nbextensions_dir = Unicode('', config=True, help="Full path to nbextensions dir (probably use prefix or user)")
    destination = Unicode('', config=True, help="Destination for the copy or symlink")
    verbose = Enum((0,1,2), default_value=1, config=True,
        help="Verbosity level"
    )

    def _config_file_name_default(self):
        return 'jupyter_notebook_config'
    
    def install_extensions(self):
        if len(self.extra_args)>1:
            raise ValueError("only one nbextension allowed at a time.  Call multiple times to install multiple extensions.")
        install_nbextension(self.extra_args[0],
            overwrite=self.overwrite,
            symlink=self.symlink,
            verbose=self.verbose,
            user=self.user,
            prefix=self.prefix,
            destination=self.destination,
            nbextensions_dir=self.nbextensions_dir,
        )
    
    def start(self):
        if not self.extra_args:
            for nbext in jupyter_path('nbextensions'):
                if os.path.exists(nbext):
                    print("Notebook extensions in %s:" % nbext)
                    for ext in os.listdir(nbext):
                        print(u"    %s" % ext)
        else:
            try:
                self.install_extensions()
            except ArgumentConflict as e:
                print(str(e), file=sys.stderr)
                self.exit(1)


class EnableNBExtensionApp(JupyterApp):
    name = "jupyter nbextension enable"
    version = __version__
    description = "Configure an nbextension to be automatically loaded"

    section = Unicode('notebook', config=True,
          help=("Which config section to add the extension to. "
                "'common' will affect all pages.")
    )

    aliases = {'section': 'EnableNBExtensionApp.section',
              }

    def _config_file_name_default(self):
        return 'jupyter_notebook_config'

    def enable_nbextension(self, name):
        # Local import to avoid circular import issue on Py 2
        from .services.config import ConfigManager
        cm = ConfigManager(parent=self, config=self.config)
        cm.update(self.section, {"load_extensions": {name: True}})

    def start(self):
        if not self.extra_args:
            sys.exit('No extensions specified')
        elif len(self.extra_args) > 1:
            sys.exit('Please specify one extension at a time')

        self.enable_nbextension(self.extra_args[0])


class DisableNBExtensionApp(JupyterApp):
    name = "jupyter nbextension disable"
    version = __version__
    description = "Remove the configuration to automatically load an extension"

    section = Unicode('notebook', config=True,
          help=("Which config section to remove the extension from. "
                "This should match the one it was previously added to.")
    )

    aliases = {'section': 'DisableNBExtensionApp.section',
              }

    def _config_file_name_default(self):
        return 'jupyter_notebook_config'

    def disable_nbextension(self, name):
        # Local import to avoid circular import issue on Py 2
        from .services.config import ConfigManager
        cm = ConfigManager(parent=self, config=self.config)
        if name not in cm.get(self.section).get('load_extensions', {}):
            sys.exit('{} is not enabled in section {}'.format(name, self.section))
        # We're using a dict as a set - updating with None removes the key
        cm.update(self.section, {"load_extensions": {name: None}})

    def start(self):
        if not self.extra_args:
            sys.exit('No extensions specified')
        elif len(self.extra_args) > 1:
            sys.exit('Please specify one extension at a time')

        self.disable_nbextension(self.extra_args[0])

class NBExtensionApp(JupyterApp):
    name = "jupyter nbextension"
    version = __version__
    description = "Work with Jupyter notebook extensions"

    subcommands = dict(
        install=(InstallNBExtensionApp,
            """Install notebook extensions"""
        ),
        enable=(EnableNBExtensionApp, "Enable a notebook extension"),
        disable=(DisableNBExtensionApp, "Disable a notebook extension"),
    )

    def start(self):
        super(NBExtensionApp, self).start()

        # The above should have called a subcommand and raised NoStart; if we
        # get here, it didn't, so we should print a message.
        subcmds = ", ".join(sorted(self.subcommands))
        sys.exit("Please supply at least one subcommand: %s" % subcmds)

main = NBExtensionApp.launch_instance

if __name__ == '__main__':
    main()
    
