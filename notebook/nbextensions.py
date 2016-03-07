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

from jupyter_core.paths import (
    jupyter_data_dir, jupyter_config_dir, jupyter_config_path,
    SYSTEM_JUPYTER_PATH, ENV_JUPYTER_PATH, ENV_CONFIG_PATH, SYSTEM_CONFIG_PATH
)
from ipython_genutils.path import ensure_dir_exists
from ipython_genutils.py3compat import string_types, cast_unicode_py2
from ipython_genutils.tempdir import TemporaryDirectory
from ._version import __version__

from traitlets.config.manager import BaseJSONConfigManager

from tornado.log import LogFormatter

# Constants for pretty print extension listing function.
# Window doesn't support coloring in the commandline
GREEN_ENABLED = '\033[32m enabled \033[0m' if os.name != 'nt' else 'enabled '
RED_DISABLED = '\033[31mdisabled\033[0m' if os.name != 'nt' else 'disabled'

DEPRECATED_ARGUMENT = object()
#------------------------------------------------------------------------------
# Public API
#------------------------------------------------------------------------------


class ArgumentConflict(ValueError):
    pass


def check_nbextension(files, user=False, prefix=None, nbextensions_dir=None, sys_prefix=False):
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
    nbext = _get_nbextension_dir(user=user, sys_prefix=sys_prefix, prefix=prefix, nbextensions_dir=nbextensions_dir)
    # make sure nbextensions dir exists
    if not os.path.exists(nbext):
        return False
    
    if isinstance(files, string_types):
        # one file given, turn it into a list
        files = [files]
    
    return all(os.path.exists(pjoin(nbext, f)) for f in files)


def install_nbextension(path, overwrite=False, symlink=False,
                        user=False, prefix=None, nbextensions_dir=None,
                        destination=None, verbose=DEPRECATED_ARGUMENT,
                        logger=None, sys_prefix=False
                        ):
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
    logger : Jupyter logger [optional]
        Logger instance to use
    """
    if verbose != DEPRECATED_ARGUMENT:
        import warnings
        warnings.warn("`install_nbextension`'s `verbose` parameter is deprecated, will have no effects,  and will be remove in Notebook 5.0", DeprecationWarning)

    nbext = _get_nbextension_dir(user=user, sys_prefix=sys_prefix, prefix=prefix, nbextensions_dir=nbextensions_dir)
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
            if logger:
                logger.info("Downloading: %s -> %s" % (path, local_path))
            urlretrieve(path, local_path)
            # now install from the local copy
            install_nbextension(local_path, overwrite=overwrite, symlink=symlink,
                nbextensions_dir=nbext, destination=destination, logger=logger)
    elif path.endswith('.zip') or _safe_is_tarfile(path):
        if symlink:
            raise ValueError("Cannot symlink from archives")
        if destination:
            raise ValueError("Cannot give destination for archives")
        if logger:
            logger.info("Extracting: %s -> %s" % (path, nbext))

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
            if logger:
                logger.info("Removing: %s" % full_dest)
            if os.path.isdir(full_dest) and not os.path.islink(full_dest):
                shutil.rmtree(full_dest)
            else:
                os.remove(full_dest)

        if symlink:
            path = os.path.abspath(path)
            if not os.path.exists(full_dest):
                if logger:
                    logger.info("Symlink: %s -> %s" % (full_dest, path))
                os.symlink(path, full_dest)
        elif os.path.isdir(path):
            path = pjoin(os.path.abspath(path), '') # end in path separator
            for parent, dirs, files in os.walk(path):
                dest_dir = pjoin(full_dest, parent[len(path):])
                if not os.path.exists(dest_dir):
                    if logger:
                        logger.info("Making directory: %s" % dest_dir)
                    os.makedirs(dest_dir)
                for file in files:
                    src = pjoin(parent, file)
                    dest_file = pjoin(dest_dir, file)
                    _maybe_copy(src, dest_file, logger=logger)
        else:
            src = path
            _maybe_copy(src, full_dest, logger=logger)


def install_nbextension_python(package, overwrite=False, symlink=False,
                        user=False, sys_prefix=False, prefix=None, nbextensions_dir=None,
                        logger=None):
    """Install an nbextension bundled in a Python package.
    
    See install_nbextension for parameter information."""
    m, nbexts = _get_nbextension_metadata(package)
    base_path = os.path.split(m.__file__)[0]
    for nbext in nbexts:
        src = os.path.join(base_path, nbext['src'])
        dest = nbext['dest']
        require = nbext['require']
        if logger:
            logger.info("%s %s %s" % (src, dest, require))
        install_nbextension(src, overwrite=overwrite, symlink=symlink,
            user=user, sys_prefix=sys_prefix, prefix=prefix, nbextensions_dir=nbextensions_dir,
            destination=dest, logger=logger
            )



def uninstall_nbextension(dest, require, user=False, sys_prefix=False, prefix=None, 
                          nbextensions_dir=None, logger=None):
    """Uninstall a Javascript extension of the notebook
    
    Removes staged files and/or directories in the nbextensions directory and 
    removes the extension from the frontend config.
    
    Parameters
    ----------
    
    dest : str
        path to file, directory, zip or tarball archive, or URL to install
        name the nbextension is installed to.  For example, if destination is 'foo', then
        the source file will be installed to 'nbextensions/foo', regardless of the source name.
        This cannot be specified if an archive is given as the source.
    require : str
        require.js path used to load the extension
    user : bool [default: False]
        Whether to install to the user's nbextensions directory.
        Otherwise do a system-wide install (e.g. /usr/local/share/jupyter/nbextensions).
    prefix : str [optional]
        Specify install prefix, if it should differ from default (e.g. /usr/local).
        Will install to ``<prefix>/share/jupyter/nbextensions``
    nbextensions_dir : str [optional]
        Specify absolute path of nbextensions directory explicitly.
    logger : Jupyter logger [optional]
        Logger instance to use
    """
    nbext = _get_nbextension_dir(user=user, sys_prefix=sys_prefix, prefix=prefix, nbextensions_dir=nbextensions_dir)
    dest = cast_unicode_py2(dest)
    full_dest = pjoin(nbext, dest)
    if os.path.lexists(full_dest):
        if logger:
            logger.info("Removing: %s" % full_dest)
        if os.path.isdir(full_dest) and not os.path.islink(full_dest):
            shutil.rmtree(full_dest)
        else:
            os.remove(full_dest)
    
    # Look through all of the config sections making sure that the nbextension
    # doesn't exist.
    config_dir = os.path.join(_get_config_dir(user=user, sys_prefix=sys_prefix), 'nbconfig')
    cm = BaseJSONConfigManager(config_dir=config_dir)
    for section in ['common', 'notebook', 'tree', 'edit', 'terminal']:
        cm.update(section, {"load_extensions": {require: None}})

def uninstall_nbextension_python(package,
                        user=False, sys_prefix=False, prefix=None, nbextensions_dir=None,
                        logger=None):
    """Uninstall an nbextension bundled in a Python package."""
    m, nbexts = _get_nbextension_metadata(package)
    for nbext in nbexts:
        dest = nbext['dest']
        require = nbext['require']
        if logger:
            logger.info("{} {}".format(dest, require))
        uninstall_nbextension(dest, require, user=user, sys_prefix=sys_prefix, 
            prefix=prefix, nbextensions_dir=nbextensions_dir, logger=logger)

def _set_nbextension_state_python(state, package, user, sys_prefix):
    """
    Enable or disable a nbextension
    """
    m, nbexts = _get_nbextension_metadata(package)
    config_dir = os.path.join(_get_config_dir(user=user, sys_prefix=sys_prefix), 'nbconfig')
    cm = BaseJSONConfigManager(config_dir=config_dir)
    for nbext in nbexts:
        cm.update(nbext['section'], {"load_extensions": {nbext['require']: state}})

def enable_nbextension_python(package, user=False, sys_prefix=False):
    """Enable an nbextension associated with a Python package."""
    _set_nbextension_state_python(True, package, user, sys_prefix)
    

def disable_nbextension_python(package, user=False, sys_prefix=False):
    """Disable an nbextension associated with a Python package."""
    _set_nbextension_state_python(False, package, user, sys_prefix)


#----------------------------------------------------------------------
# Applications
#----------------------------------------------------------------------

from traitlets import Bool, Unicode, Any
from jupyter_core.application import JupyterApp


_base_flags = {
    "user" : ({
        "BaseNBExtensionApp" : {
            "user" : True,
        }}, "Install to the user's Jupyter directory"
    ),
    "sys-prefix" : ({
        "BaseNBExtensionApp" : {
            "sys_prefix" : True,
        }}, "Use sys.prefix as the prefix for installing nbextensions"
    ),
    "py" : ({
        "BaseNBExtensionApp" : {
            "python" : True,
        }}, "Install from a Python package"
    ),
}
_base_flags['python'] = _base_flags['py']

class BaseNBExtensionApp(JupyterApp):

    _log_formatter_cls = LogFormatter
    flags = _base_flags
    version = __version__
    
    user = Bool(False, config=True, help="Whether to do a user install")
    sys_prefix = Bool(False, config=True, help="Use the sys.prefix as the prefix")
    python = Bool(False, config=True, help="Install from a Python package")

    # Remove for 5.0...
    verbose = Any(None, config=True, help="DEPRECATED: Verbosity level")

    def _verbose_changed(self):
        import warnings
        warnings.warn("`verbose` traits of `{}` has been deprecated, has no effects and will be removed in notebook 5.0.".format(type(self).__name__), DeprecationWarning)

    def _log_format_default(self):
        return "%(message)s"


flags = {}
flags.update(_base_flags)
flags.update({
    "overwrite" : ({
        "InstallNBExtensionApp" : {
            "overwrite" : True,
        }}, "Force overwrite of existing files"
    ),
    "symlink" : ({
        "InstallNBExtensionApp" : {
            "symlink" : True,
        }}, "Create symlink instead of copying files"
    ),
})

flags['s'] = flags['symlink']

aliases = {
    "prefix" : "InstallNBExtensionApp.prefix",
    "nbextensions" : "InstallNBExtensionApp.nbextensions_dir",
    "destination" : "InstallNBExtensionApp.destination",
}

class InstallNBExtensionApp(BaseNBExtensionApp):
    """Entry point for installing notebook extensions"""
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

    prefix = Unicode('', config=True, help="Installation prefix")
    nbextensions_dir = Unicode('', config=True, help="Full path to nbextensions dir (probably use prefix or user)")
    destination = Unicode('', config=True, help="Destination for the copy or symlink")

    def _config_file_name_default(self):
        return 'jupyter_notebook_config'
    
    def install_extensions(self):
        if len(self.extra_args)>1:
            raise ValueError("only one nbextension allowed at a time.  Call multiple times to install multiple extensions.")
        install = install_nbextension_python if self.python else install_nbextension
        install(self.extra_args[0],
            overwrite=self.overwrite,
            symlink=self.symlink,
            user=self.user,
            sys_prefix=self.sys_prefix,
            prefix=self.prefix,
            nbextensions_dir=self.nbextensions_dir,
            logger=self.log
        )
    
    def start(self):
        if not self.extra_args:
            sys.exit('Please specify an nbextension to install')
        else:
            try:
                self.install_extensions()
            except ArgumentConflict as e:
                sys.exit(str(e))


class UninstallNBExtensionApp(BaseNBExtensionApp):
    """Entry point for uninstalling notebook extensions"""
    version = __version__
    description = """Uninstall Jupyter notebook extensions
    
    Usage
    
        jupyter nbextension uninstall path/url path/url/entrypoint
        jupyter nbextension uninstall --py pythonPackageName
    
    This uninstalls an nbextension.
    """
    
    examples = """
    jupyter nbextension uninstall dest/dir dest/dir/extensionjs
    jupyter nbextension uninstall --py extensionPyPackage
    """
    aliases = {'section': 'ToggleNBExtensionApp.section'}
    
    
    prefix = Unicode('', config=True, help="Installation prefix")
    nbextensions_dir = Unicode('', config=True, help="Full path to nbextensions dir (probably use prefix or user)")
    destination = Unicode('', config=True, help="Destination for the copy or symlink")
    
    def _config_file_name_default(self):
        return 'jupyter_notebook_config'
    
    def uninstall_extensions(self):
        kwargs = {
            'user': self.user,
            'sys_prefix': self.sys_prefix,
            'prefix': self.prefix,
            'nbextensions_dir': self.nbextensions_dir,
            'logger': self.log
        }
        
        arg_count = 1 if self.python else 2
        if len(self.extra_args)>arg_count:
            raise ValueError("only one nbextension allowed at a time.  Call multiple times to uninstall multiple extensions.")
        if len(self.extra_args)<arg_count:
            raise ValueError("not enough arguments")
        
        if self.python:    
            uninstall_nbextension_python(self.extra_args[0], **kwargs)
        else:
            uninstall_nbextension(self.extra_args[0], self.extra_args[1], **kwargs)
    
    def start(self):
        if not self.extra_args:
            sys.exit('Please specify an nbextension to uninstall')
        else:
            try:
                self.uninstall_extensions()
            except ArgumentConflict as e:
                sys.exit(str(e))


class ToggleNBExtensionApp(BaseNBExtensionApp):
    
    name = "jupyter nbextension enable/disable"
    version = __version__
    description = "Enable/disable an nbextension using frontend configuration files."

    section = Unicode('notebook', config=True,
          help="""Which config section to add the extension to, 'common' will affect all pages."""
    )

    aliases = {'section': 'ToggleNBExtensionApp.section'}
    
    _toggle_value = None

    def _config_file_name_default(self):
        return 'jupyter_notebook_config'

    def _toggle_nbextension(self, section, require):
        config_dir = os.path.join(_get_config_dir(user=self.user, sys_prefix=self.sys_prefix), 'nbconfig')
        cm = BaseJSONConfigManager(parent=self, config_dir=config_dir)
        if self._toggle_value is None and require not in cm.get(section).get('load_extensions', {}):
            sys.exit('{} is not enabled in section {}'.format(require, section))
        # We're using a dict as a set - updating with None removes the key
        cm.update(section, {"load_extensions": {require: self._toggle_value}})
    
    def toggle_nbextension_python(self, package):
        m, nbexts = _get_nbextension_metadata(package)
        for nbext in nbexts:
            section = nbext['section']
            require = nbext['require']
            self._toggle_nbextension(section, require)

    def toggle_nbextension(self, require):
        self._toggle_nbextension(self.section, require)
        
    def start(self):

        if not self.extra_args:
            sys.exit('Please specify an nbextension/package to enable or disable')
        elif len(self.extra_args) > 1:
            sys.exit('Please specify one nbextension/package at a time')
        if self.python:
            self.toggle_nbextension_python(self.extra_args[0])
        else:
            self.toggle_nbextension(self.extra_args[0])


class EnableNBExtensionApp(ToggleNBExtensionApp):

    name = "jupyter nbextension enable"
    description = "Enable an nbextension using frontend configuration files."
    _toggle_value = True


class DisableNBExtensionApp(ToggleNBExtensionApp):
    
    name = "jupyter nbextension disable"
    description = "Disable an nbextension using frontend configuration files."
    _toggle_value = None


class ListNBExtensionsApp(BaseNBExtensionApp):
    
    name = "jupyter nbextension list"
    version = __version__
    description = "List all nbextensions known by the configuration system"
    
    def list_nbextensions(self):
        config_dirs = [os.path.join(p, 'nbconfig') for p in jupyter_config_path()]
        for config_dir in config_dirs:
            self.log.info('config dir: {}'.format(config_dir))
            cm = BaseJSONConfigManager(parent=self, config_dir=config_dir)
            for section in ['common', 'notebook', 'tree', 'edit', 'terminal']:
                data = cm.get(section)
                if 'load_extensions' in data:
                    self.log.info('  {} section'.format(section))
                    
                    load_extensions = data['load_extensions']
                    for x in load_extensions:
                        self.log.info('   {1} {0}'.format(x, GREEN_ENABLED if load_extensions[x] else RED_DISABLED))
    
    def start(self):
        self.list_nbextensions()


_examples = """
jupyter nbextension list                          # list all configured nbextensions
jupyter nbextension install --py <packagename>    # install an nbextension from a Python package
jupyter nbextension enable --py <packagename>     # enable all nbextensions in a Python package
jupyter nbextension disable --py <packagename>    # disable all nbextensions in a Python package
jupyter nbextension uninstall --py <packagename>  # uninstall an nbextension in a Python package
"""

class NBExtensionApp(BaseNBExtensionApp):

    name = "jupyter nbextension"
    version = __version__
    description = "Work with Jupyter notebook extensions"
    examples = _examples

    subcommands = dict(
        install=(InstallNBExtensionApp,"Install an nbextension"),
        enable=(EnableNBExtensionApp, "Enable an nbextension"),
        disable=(DisableNBExtensionApp, "Disable an nbextension"),
        uninstall=(UninstallNBExtensionApp, "Uninstall an nbextension"),
        list=(ListNBExtensionsApp, "List nbextensions")
    )

    def start(self):
        super(NBExtensionApp, self).start()

        # The above should have called a subcommand and raised NoStart; if we
        # get here, it didn't, so we should self.log.info a message.
        subcmds = ", ".join(sorted(self.subcommands))
        sys.exit("Please supply at least one subcommand: %s" % subcmds)

main = NBExtensionApp.launch_instance

#------------------------------------------------------------------------------
# Private API
#------------------------------------------------------------------------------


def _should_copy(src, dest, logger=None):
    """Should a file be copied?"""
    if not os.path.exists(dest):
        return True
    if os.stat(src).st_mtime - os.stat(dest).st_mtime > 1e-6:
        # we add a fudge factor to work around a bug in python 2.x
        # that was fixed in python 3.x: http://bugs.python.org/issue12904
        if logger:
            logger.warn("%s is out of date" % dest)
        return True
    if logger:
        logger.info("%s is up to date" % dest)
    return False


def _maybe_copy(src, dest, logger=None):
    """Copy a file if it needs updating."""
    if _should_copy(src, dest, logger=logger):
        if logger:
            logger.info("Copying: %s -> %s" % (src, dest))
        shutil.copy2(src, dest)


def _safe_is_tarfile(path):
    """Safe version of is_tarfile, return False on IOError."""
    try:
        return tarfile.is_tarfile(path)
    except IOError:
        return False


def _get_nbextension_dir(user=False, sys_prefix=False, prefix=None, nbextensions_dir=None):
    """Return the nbextension directory specified"""
    if sum(map(bool, [user, prefix, nbextensions_dir, sys_prefix])) > 1:
        raise ArgumentConflict("cannot specify more than one of user, sys_prefix, prefix, or nbextensions_dir")
    if user:
        nbext = pjoin(jupyter_data_dir(), u'nbextensions')
    elif sys_prefix:
        nbext = pjoin(ENV_JUPYTER_PATH[0], u'nbextensions')
    elif prefix:
        nbext = pjoin(prefix, 'share', 'jupyter', 'nbextensions')
    elif nbextensions_dir:
        nbext = nbextensions_dir
    else:
        nbext = pjoin(SYSTEM_JUPYTER_PATH[0], 'nbextensions')
    return nbext


def _get_config_dir(user=False, sys_prefix=False):
    if user and sys_prefix:
        raise ArgumentConflict("Cannot specify more than one of user or sys_prefix")
    if user:
        nbext = jupyter_config_dir()
    elif sys_prefix:
        nbext = ENV_CONFIG_PATH[0]
    else:
        nbext = SYSTEM_CONFIG_PATH[0]
    return nbext


def _get_nbextension_metadata(package):
    m = __import__(package)
    if not hasattr(m, '_jupyter_nbextension_paths'):
        raise KeyError('The Python package {} is not a valid nbextension'.format(package))
    nbexts = m._jupyter_nbextension_paths()
    return m, nbexts


def _read_config_data(user=False, sys_prefix=False):
    config_dir = _get_config_dir(user=user, sys_prefix=sys_prefix)
    config_man = BaseJSONConfigManager(config_dir=config_dir)
    return config_man.get('jupyter_notebook_config')


def _write_config_data(data, user=False, sys_prefix=False):
    config_dir = _get_config_dir(user=user, sys_prefix=sys_prefix)
    config_man = BaseJSONConfigManager(config_dir=config_dir)
    config_man.update('jupyter_notebook_config', data)
        

if __name__ == '__main__':
    main()
    
