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
from os.path import basename, join as pjoin, normpath

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
from traitlets.utils.importstring import import_item

from tornado.log import LogFormatter

# Constants for pretty print extension listing function.
# Window doesn't support coloring in the commandline
GREEN_ENABLED = '\033[32m enabled \033[0m' if os.name != 'nt' else 'enabled '
RED_DISABLED = '\033[31mdisabled\033[0m' if os.name != 'nt' else 'disabled'

DEPRECATED_ARGUMENT = object()

NBCONFIG_SECTIONS = ['common', 'notebook', 'tree', 'edit', 'terminal']

GREEN_OK = '\033[32mOK\033[0m' if os.name != 'nt' else 'ok'
RED_X = '\033[31m X\033[0m' if os.name != 'nt' else ' X'

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
        Whether to check the user's .jupyter/nbextensions directory.
        Otherwise check a system-wide install (e.g. /usr/local/share/jupyter/nbextensions).
    prefix : str [optional]
        Specify install prefix, if it should differ from default (e.g. /usr/local).
        Will check prefix/share/jupyter/nbextensions
    nbextensions_dir : str [optional]
        Specify absolute path of nbextensions directory explicitly.
    sys_prefix : bool [default: False]
        Install into the sys.prefix, i.e. environment
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
        warnings.warn("`install_nbextension`'s `verbose` parameter is deprecated, it will have no effects and will be removed in Notebook 5.0", DeprecationWarning)

    # the actual path to which we eventually installed
    full_dest = None

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
            full_dest = install_nbextension(local_path, overwrite=overwrite, symlink=symlink,
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
        # TODO: what to do here
        full_dest = None
    else:
        if not destination:
            destination = basename(path)
        destination = cast_unicode_py2(destination)
        full_dest = normpath(pjoin(nbext, destination))
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
                    logger.info("Symlinking: %s -> %s" % (full_dest, path))
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

    return full_dest


def install_nbextension_python(module, overwrite=False, symlink=False,
                        user=False, sys_prefix=False, prefix=None, nbextensions_dir=None, logger=None):
    """Install an nbextension bundled in a Python package.

    Returns a list of installed/updated directories.

    See install_nbextension for parameter information."""
    m, nbexts = _get_nbextension_metadata(module)
    base_path = os.path.split(m.__file__)[0]

    full_dests = []

    for nbext in nbexts:
        src = os.path.join(base_path, nbext['src'])
        dest = nbext['dest']

        if logger:
            logger.info("Installing %s -> %s" % (src, dest))
        full_dest = install_nbextension(
            src, overwrite=overwrite, symlink=symlink,
            user=user, sys_prefix=sys_prefix, prefix=prefix, nbextensions_dir=nbextensions_dir,
            destination=dest, logger=logger
            )
        validate_nbextension_python(nbext, full_dest, logger)
        full_dests.append(full_dest)

    return full_dests


def uninstall_nbextension(dest, require=None, user=False, sys_prefix=False, prefix=None, 
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
    require : str [optional]
        require.js path used to load the extension.
        If specified, frontend config loading extension will be removed.
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
    if require:
        for section in NBCONFIG_SECTIONS:
            cm.update(section, {"load_extensions": {require: None}})


def uninstall_nbextension_python(module,
                        user=False, sys_prefix=False, prefix=None, nbextensions_dir=None,
                        logger=None):
    """Uninstall an nbextension bundled in a Python package.
    
    See parameters of `install_nbextension_python`
    """
    m, nbexts = _get_nbextension_metadata(module)
    for nbext in nbexts:
        dest = nbext['dest']
        require = nbext['require']
        if logger:
            logger.info("Uninstalling {} {}".format(dest, require))
        uninstall_nbextension(dest, require, user=user, sys_prefix=sys_prefix, 
            prefix=prefix, nbextensions_dir=nbextensions_dir, logger=logger)


def _set_nbextension_state(section, require, state,
                           user=True, sys_prefix=False, logger=None):
    """Set whether the section's frontend should require the named nbextension

    Returns True if the final state is the one requested.

    Parameters
    ----------
    section : string
        The section of the server to change, one of NBCONFIG_SECTIONS
    require : string
        An importable AMD module inside the nbextensions static path
    state : bool
        The state in which to leave the extension
    user : bool [default: True]
        Whether to update the user's .jupyter/nbextensions directory
    sys_prefix : bool [default: False]
        Whether to update the sys.prefix, i.e. environment. Will override
        `user`.
    logger : Jupyter logger [optional]
        Logger instance to use
    """
    user = False if sys_prefix else user
    config_dir = os.path.join(
        _get_config_dir(user=user, sys_prefix=sys_prefix), 'nbconfig')
    cm = BaseJSONConfigManager(config_dir=config_dir)
    if logger:
        logger.info("{} {} extension {}...".format(
            "Enabling" if state else "Disabling",
            section,
            require
        ))
    cm.update(section, {"load_extensions": {require: state}})

    validate_nbextension(require, logger=logger)

    return cm.get(section).get(require) == state


def _set_nbextension_state_python(state, module, user, sys_prefix,
                                  logger=None):
    """Enable or disable some nbextensions stored in a Python package

    Returns a list of whether the state was achieved (i.e. changed, or was
    already right)

    Parameters
    ----------

    state : Bool
        Whether the extensions should be enabled
    module : str
        Importable Python module exposing the
        magic-named `_jupyter_nbextension_paths` function
    user : bool
        Whether to enable in the user's nbextensions directory.
    sys_prefix : bool
        Enable/disable in the sys.prefix, i.e. environment
    logger : Jupyter logger [optional]
        Logger instance to use
    """
    m, nbexts = _get_nbextension_metadata(module)
    return [_set_nbextension_state(section=nbext["section"],
                                   require=nbext["require"],
                                   state=state,
                                   user=user, sys_prefix=sys_prefix,
                                   logger=logger)
            for nbext in nbexts]


def enable_nbextension(section, require, user=True, sys_prefix=False,
                       logger=None):
    """Enable a named nbextension

    Returns True if the final state is the one requested.

    Parameters
    ----------

    section : string
        The section of the server to change, one of NBCONFIG_SECTIONS
    require : string
        An importable AMD module inside the nbextensions static path
    user : bool [default: True]
        Whether to enable in the user's nbextensions directory.
    sys_prefix : bool [default: False]
        Whether to enable in the sys.prefix, i.e. environment. Will override
        `user`
    logger : Jupyter logger [optional]
        Logger instance to use
    """
    return _set_nbextension_state(section=section, require=require,
                                  state=True,
                                  user=user, sys_prefix=sys_prefix,
                                  logger=logger)


def disable_nbextension(section, require, user=True, sys_prefix=False,
                        logger=None):
    """Disable a named nbextension
    
    Returns True if the final state is the one requested.

    Parameters
    ----------

    section : string
        The section of the server to change, one of NBCONFIG_SECTIONS
    require : string
        An importable AMD module inside the nbextensions static path
    user : bool [default: True]
        Whether to enable in the user's nbextensions directory.
    sys_prefix : bool [default: False]
        Whether to enable in the sys.prefix, i.e. environment. Will override
        `user`.
    logger : Jupyter logger [optional]
        Logger instance to use
    """
    return _set_nbextension_state(section=section, require=require,
                                  state=False,
                                  user=user, sys_prefix=sys_prefix,
                                  logger=logger)


def enable_nbextension_python(module, user=True, sys_prefix=False,
                              logger=None):
    """Enable some nbextensions associated with a Python module.

    Returns a list of whether the state was achieved (i.e. changed, or was
    already right)

    Parameters
    ----------

    module : str
        Importable Python module exposing the
        magic-named `_jupyter_nbextension_paths` function
    user : bool [default: True]
        Whether to enable in the user's nbextensions directory.
    sys_prefix : bool [default: False]
        Whether to enable in the sys.prefix, i.e. environment. Will override
        `user`
    logger : Jupyter logger [optional]
        Logger instance to use
    """
    return _set_nbextension_state_python(True, module, user, sys_prefix,
                                         logger=logger)


def disable_nbextension_python(module, user=True, sys_prefix=False,
                               logger=None):
    """Disable some nbextensions associated with a Python module.
    
    Returns True if the final state is the one requested.

    Parameters
    ----------

    module : str
        Importable Python module exposing the
        magic-named `_jupyter_nbextension_paths` function
    user : bool [default: True]
        Whether to enable in the user's nbextensions directory.
    sys_prefix : bool [default: False]
        Whether to enable in the sys.prefix, i.e. environment
    logger : Jupyter logger [optional]
        Logger instance to use
    """
    return _set_nbextension_state_python(False, module, user, sys_prefix,
                                         logger=logger)


def validate_nbextension(require, logger=None):
    """Validate a named nbextension.

    Looks across all of the nbextension directories.

    Returns a list of warnings.

    require : str
        require.js path used to load the extension
    logger : Jupyter logger [optional]
        Logger instance to use
    """
    warnings = []
    infos = []

    js_exists = False
    for exts in _nbextension_dirs():
        # Does the Javascript entrypoint actually exist on disk?
        js = u"{}.js".format(os.path.join(exts, *require.split("/")))
        js_exists = os.path.exists(js)
        if js_exists:
            break

    require_tmpl = u"        - require? {} {}"
    if js_exists:
        infos.append(require_tmpl.format(GREEN_OK, require))
    else:
        warnings.append(require_tmpl.format(RED_X, require))
    
    if logger:
        if warnings:
            logger.warning(u"      - Validating: problems found:")
            for msg in warnings:
                logger.warning(msg)
            for msg in infos:
                logger.info(msg)
        else:
            logger.info(u"      - Validating: {}".format(GREEN_OK))
    
    return warnings


def validate_nbextension_python(spec, full_dest, logger=None):
    """Assess the health of an installed nbextension

    Returns a list of warnings.

    Parameters
    ----------

    spec : dict
        A single entry of _jupyter_nbextension_paths():
            [{
                'section': 'notebook',
                'src': 'mockextension',
                'dest': '_mockdestination',
                'require': '_mockdestination/index'
            }]
    full_dest : str
        The on-disk location of the installed nbextension: this should end
        with `nbextensions/<dest>`
    logger : Jupyter logger [optional]
        Logger instance to use
    """
    infos = []
    warnings = []

    section = spec.get("section", None)
    if section in NBCONFIG_SECTIONS:
        infos.append(u"  {} section: {}".format(GREEN_OK, section))
    else:
        warnings.append(u"  {}  section: {}".format(RED_X, section))

    require = spec.get("require", None)
    if require is not None:
        require_path = os.path.join(
            full_dest[0:-len(spec["dest"])],
            u"{}.js".format(require))
        if os.path.exists(require_path):
            infos.append(u"  {} require: {}".format(GREEN_OK, require_path))
        else:
            warnings.append(u"  {}  require: {}".format(RED_X, require_path))

    if logger:
        if warnings:
            logger.warning("- Validating: problems found:")
            for msg in warnings:
                logger.warning(msg)
            for msg in infos:
                logger.info(msg)
            logger.warning(u"Full spec: {}".format(spec))
        else:
            logger.info(u"- Validating: {}".format(GREEN_OK))

    return warnings


#----------------------------------------------------------------------
# Applications
#----------------------------------------------------------------------

from traitlets import Bool, Unicode, Any
from jupyter_core.application import JupyterApp

_base_flags = {}
_base_flags.update(JupyterApp.flags)
_base_flags.pop("y", None)
_base_flags.pop("generate-config", None)
_base_flags.update({
    "user" : ({
        "BaseNBExtensionApp" : {
            "user" : True,
        }}, "Apply the operation only for the given user"
    ),
    "system" : ({
        "BaseNBExtensionApp" : {
            "user" : False,
            "sys_prefix": False,
        }}, "Apply the operation system-wide"
    ),
    "sys-prefix" : ({
        "BaseNBExtensionApp" : {
            "sys_prefix" : True,
        }}, "Use sys.prefix as the prefix for installing nbextensions (for environments, packaging)"
    ),
    "py" : ({
        "BaseNBExtensionApp" : {
            "python" : True,
        }}, "Install from a Python package"
    )
})
_base_flags['python'] = _base_flags['py']

class BaseNBExtensionApp(JupyterApp):
    """Base nbextension installer app"""
    _log_formatter_cls = LogFormatter
    flags = _base_flags
    version = __version__
    
    user = Bool(False, config=True, help="Whether to do a user install")
    sys_prefix = Bool(False, config=True, help="Use the sys.prefix as the prefix")
    python = Bool(False, config=True, help="Install from a Python package")

    # Remove for 5.0...
    verbose = Any(None, config=True, help="DEPRECATED: Verbosity level")

    def _verbose_changed(self):
        """Warn about verbosity changes"""
        import warnings
        warnings.warn("`verbose` traits of `{}` has been deprecated, has no effects and will be removed in notebook 5.0.".format(type(self).__name__), DeprecationWarning)

    def _log_format_default(self):
        """A default format for messages"""
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
    
        jupyter nbextension install path|url [--user|--sys-prefix]
    
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
    nbextensions_dir = Unicode('', config=True,
           help="Full path to nbextensions dir (probably use prefix or user)")
    destination = Unicode('', config=True, help="Destination for the copy or symlink")

    def _config_file_name_default(self):
        """The default config file name."""
        return 'jupyter_notebook_config'
    
    def install_extensions(self):
        """Perform the installation of nbextension(s)"""
        if len(self.extra_args)>1:
            raise ValueError("Only one nbextension allowed at a time. "
                         "Call multiple times to install multiple extensions.")

        if self.python:
            install = install_nbextension_python
            kwargs = {}
        else:
            install = install_nbextension
            kwargs = {'destination': self.destination}
        
        full_dests = install(self.extra_args[0],
                             overwrite=self.overwrite,
                             symlink=self.symlink,
                             user=self.user,
                             sys_prefix=self.sys_prefix,
                             prefix=self.prefix,
                             nbextensions_dir=self.nbextensions_dir,
                             logger=self.log,
                             **kwargs
                            )

        if full_dests:
            self.log.info(
                u"\nTo initialize this nbextension in the browser every time"
                " the notebook (or other app) loads:\n\n"
                "      jupyter nbextension enable {}{}{}{}\n".format(
                    self.extra_args[0] if self.python else "<the entry point>",
                    " --user" if self.user else "",
                    " --py" if self.python else "",
                    " --sys-prefix" if self.sys_prefix else ""
                )
            )

    def start(self):
        """Perform the App's function as configured"""
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
    
    aliases = {
        "prefix" : "UninstallNBExtensionApp.prefix",
        "nbextensions" : "UninstallNBExtensionApp.nbextensions_dir",
        "require": "UninstallNBExtensionApp.require",
    }
    
    prefix = Unicode('', config=True, help="Installation prefix")
    nbextensions_dir = Unicode('', config=True, help="Full path to nbextensions dir (probably use prefix or user)")
    require = Unicode('', config=True, help="require.js module to load.")
    
    def _config_file_name_default(self):
        """The default config file name."""
        return 'jupyter_notebook_config'
    
    def uninstall_extensions(self):
        """Uninstall some nbextensions"""
        kwargs = {
            'user': self.user,
            'sys_prefix': self.sys_prefix,
            'prefix': self.prefix,
            'nbextensions_dir': self.nbextensions_dir,
            'logger': self.log
        }
        
        arg_count = 1
        if len(self.extra_args) > arg_count:
            raise ValueError("only one nbextension allowed at a time.  Call multiple times to uninstall multiple extensions.")
        if len(self.extra_args) < arg_count:
            raise ValueError("not enough arguments")
        
        if self.python:
            uninstall_nbextension_python(self.extra_args[0], **kwargs)
        else:
            if self.require:
                kwargs['require'] = self.require
            uninstall_nbextension(self.extra_args[0], **kwargs)
    
    def start(self):
        if not self.extra_args:
            sys.exit('Please specify an nbextension to uninstall')
        else:
            try:
                self.uninstall_extensions()
            except ArgumentConflict as e:
                sys.exit(str(e))


class ToggleNBExtensionApp(BaseNBExtensionApp):
    """A base class for apps that enable/disable extensions"""
    name = "jupyter nbextension enable/disable"
    version = __version__
    description = "Enable/disable an nbextension in configuration."

    section = Unicode('notebook', config=True,
          help="""Which config section to add the extension to, 'common' will affect all pages."""
    )
    user = Bool(True, config=True, help="Apply the configuration only for the current user (default)")

    aliases = {'section': 'ToggleNBExtensionApp.section'}
    
    _toggle_value = None

    def _config_file_name_default(self):
        """The default config file name."""
        return 'jupyter_notebook_config'
    
    def toggle_nbextension_python(self, module):
        """Toggle some extensions in an importable Python module.

        Returns a list of booleans indicating whether the state was changed as
        requested.

        Parameters
        ----------
        module : str
            Importable Python module exposing the
            magic-named `_jupyter_nbextension_paths` function
        """
        toggle = (enable_nbextension_python if self._toggle_value
                  else disable_nbextension_python)
        return toggle(module,
                      user=self.user,
                      sys_prefix=self.sys_prefix,
                      logger=self.log)

    def toggle_nbextension(self, require):
        """Toggle some a named nbextension by require-able AMD module.

        Returns whether the state was changed as requested.

        Parameters
        ----------
        require : str
            require.js path used to load the nbextension
        """
        toggle = (enable_nbextension if self._toggle_value
                  else disable_nbextension)
        return toggle(self.section, require,
                      user=self.user, sys_prefix=self.sys_prefix,
                      logger=self.log)
        
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
    """An App that enables nbextensions"""
    name = "jupyter nbextension enable"
    description = """
    Enable an nbextension in frontend configuration.
    
    Usage
        jupyter nbextension enable [--system|--sys-prefix]
    """
    _toggle_value = True


class DisableNBExtensionApp(ToggleNBExtensionApp):
    """An App that disables nbextensions"""
    name = "jupyter nbextension disable"
    description = """
    Enable an nbextension in frontend configuration.
    
    Usage
        jupyter nbextension disable [--system|--sys-prefix]
    """
    _toggle_value = None


class ListNBExtensionsApp(BaseNBExtensionApp):
    """An App that lists and validates nbextensions"""
    name = "jupyter nbextension list"
    version = __version__
    description = "List all nbextensions known by the configuration system"
    
    def list_nbextensions(self):
        """List all the nbextensions"""
        config_dirs = [os.path.join(p, 'nbconfig') for p in jupyter_config_path()]
        
        print("Known nbextensions:")
        
        for config_dir in config_dirs:
            head = u'  config dir: {}'.format(config_dir)
            head_shown = False

            cm = BaseJSONConfigManager(parent=self, config_dir=config_dir)
            for section in NBCONFIG_SECTIONS:
                data = cm.get(section)
                if 'load_extensions' in data:
                    if not head_shown:
                        # only show heading if there is an nbextension here
                        print(head)
                        head_shown = True
                    print(u'    {} section'.format(section))
                    
                    for require, enabled in data['load_extensions'].items():
                        print(u'      {} {}'.format(
                            require,
                            GREEN_ENABLED if enabled else RED_DISABLED))
                        if enabled:
                            validate_nbextension(require, logger=self.log)
    
    def start(self):
        """Perform the App's functions as configured"""
        self.list_nbextensions()


_examples = """
jupyter nbextension list                          # list all configured nbextensions
jupyter nbextension install --py <packagename>    # install an nbextension from a Python package
jupyter nbextension enable --py <packagename>     # enable all nbextensions in a Python package
jupyter nbextension disable --py <packagename>    # disable all nbextensions in a Python package
jupyter nbextension uninstall --py <packagename>  # uninstall an nbextension in a Python package
"""

class NBExtensionApp(BaseNBExtensionApp):
    """Base jupyter nbextension command entry point"""
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
        """Perform the App's functions as configured"""
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
    """Should a file be copied, if it doesn't exist, or is newer?

    Returns whether the file needs to be updated.

    Parameters
    ----------

    src : string
        A path that should exist from which to copy a file
    src : string
        A path that might exist to which to copy a file
    logger : Jupyter logger [optional]
        Logger instance to use
    """
    if not os.path.exists(dest):
        return True
    if os.stat(src).st_mtime - os.stat(dest).st_mtime > 1e-6:
        # we add a fudge factor to work around a bug in python 2.x
        # that was fixed in python 3.x: http://bugs.python.org/issue12904
        if logger:
            logger.warn("Out of date: %s" % dest)
        return True
    if logger:
        logger.info("Up to date: %s" % dest)
    return False


def _maybe_copy(src, dest, logger=None):
    """Copy a file if it needs updating.

    Parameters
    ----------

    src : string
        A path that should exist from which to copy a file
    src : string
        A path that might exist to which to copy a file
    logger : Jupyter logger [optional]
        Logger instance to use
    """
    if _should_copy(src, dest, logger=logger):
        if logger:
            logger.info("Copying: %s -> %s" % (src, dest))
        shutil.copy2(src, dest)


def _safe_is_tarfile(path):
    """Safe version of is_tarfile, return False on IOError.

    Returns whether the file exists and is a tarfile.

    Parameters
    ----------

    path : string
        A path that might not exist and or be a tarfile
    """
    try:
        return tarfile.is_tarfile(path)
    except IOError:
        return False


def _get_nbextension_dir(user=False, sys_prefix=False, prefix=None, nbextensions_dir=None):
    """Return the nbextension directory specified

    Parameters
    ----------

    user : bool [default: False]
        Get the user's .jupyter/nbextensions directory
    sys_prefix : bool [default: False]
        Get sys.prefix, i.e. ~/.envs/my-env/share/jupyter/nbextensions
    prefix : str [optional]
        Get custom prefix
    nbextensions_dir : str [optional]
        Get what you put in
    """
    conflicting = [
        ('user', user),
        ('prefix', prefix),
        ('nbextensions_dir', nbextensions_dir),
        ('sys_prefix', sys_prefix),
    ]
    conflicting_set = ['{}={!r}'.format(n, v) for n, v in conflicting if v]
    if len(conflicting_set) > 1:
        raise ArgumentConflict(
            "cannot specify more than one of user, sys_prefix, prefix, or nbextensions_dir, but got: {}"
            .format(', '.join(conflicting_set)))
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


def _nbextension_dirs():
    """The possible locations of nbextensions.

    Returns a list of known base extension locations
    """
    return [
        pjoin(jupyter_data_dir(), u'nbextensions'),
        pjoin(ENV_JUPYTER_PATH[0], u'nbextensions'),
        pjoin(SYSTEM_JUPYTER_PATH[0], 'nbextensions')
    ]


def _get_config_dir(user=False, sys_prefix=False):
    """Get the location of config files for the current context

    Returns the string to the enviornment

    Parameters
    ----------

    user : bool [default: False]
        Get the user's .jupyter config directory
    sys_prefix : bool [default: False]
        Get sys.prefix, i.e. ~/.envs/my-env/etc/jupyter
    """
    user = False if sys_prefix else user
    if user and sys_prefix:
        raise ArgumentConflict("Cannot specify more than one of user or sys_prefix")
    if user:
        nbext = jupyter_config_dir()
    elif sys_prefix:
        nbext = ENV_CONFIG_PATH[0]
    else:
        nbext = SYSTEM_CONFIG_PATH[0]
    return nbext


def _get_nbextension_metadata(module):
    """Get the list of nbextension paths associated with a Python module.

    Returns a tuple of (the module,             [{
        'section': 'notebook',
        'src': 'mockextension',
        'dest': '_mockdestination',
        'require': '_mockdestination/index'
    }])

    Parameters
    ----------

    module : str
        Importable Python module exposing the
        magic-named `_jupyter_nbextension_paths` function
    """
    m = import_item(module)
    if not hasattr(m, '_jupyter_nbextension_paths'):
        raise KeyError('The Python module {} is not a valid nbextension, '
                       'it is missing the `_jupyter_nbextension_paths()` method.'.format(module))
    nbexts = m._jupyter_nbextension_paths()
    return m, nbexts


def _read_config_data(user=False, sys_prefix=False):
    """Get the config for the current context

    Returns the string to the enviornment

    Parameters
    ----------

    user : bool [default: False]
        Get the user's .jupyter config directory
    sys_prefix : bool [default: False]
        Get sys.prefix, i.e. ~/.envs/my-env/etc/jupyter
    """
    config_dir = _get_config_dir(user=user, sys_prefix=sys_prefix)
    config_man = BaseJSONConfigManager(config_dir=config_dir)
    return config_man.get('jupyter_notebook_config')


def _write_config_data(data, user=False, sys_prefix=False):
    """Update the config for the current context

    Parameters
    ----------
    data : object
        An object which can be accepted by ConfigManager.update
    user : bool [default: False]
        Get the user's .jupyter config directory
    sys_prefix : bool [default: False]
        Get sys.prefix, i.e. ~/.envs/my-env/etc/jupyter
    """
    config_dir = _get_config_dir(user=user, sys_prefix=sys_prefix)
    config_man = BaseJSONConfigManager(config_dir=config_dir)
    config_man.update('jupyter_notebook_config', data)


if __name__ == '__main__':
    main()
