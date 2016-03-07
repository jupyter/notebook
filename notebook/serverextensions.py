# coding: utf-8
"""Utilities for installing server extensions for the notebook"""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from __future__ import print_function


import sys

from jupyter_core.paths import jupyter_config_path
from ._version import __version__
from .nbextensions import (
    BaseNBExtensionApp, _get_config_dir,
    GREEN_ENABLED, RED_DISABLED
)

from traitlets import Bool
from traitlets.config.manager import BaseJSONConfigManager

# ------------------------------------------------------------------------------
# Public API
# ------------------------------------------------------------------------------


class ArgumentConflict(ValueError):
    pass


def toggle_serverextension_python(import_name, enabled=None, parent=None,
                                  user=False, sys_prefix=False):
    """Toggle a server extension.

    By default, toggles the extension in the system-wide Jupyter configuration
    location (e.g. /usr/local/etc/jupyter).

    Parameters
    ----------

    import_name : str
        Importable Python module (dotted-notation) exposing the magic-named
        `load_jupyter_server_extension` function
    enabled : bool [default: None]
        Toggle state for the extension.  Set to None to toggle, True to enable,
        and False to disable the extension.
    parent : Configurable [default: None]
    user : bool [default: False]
        Toggle in the user's configuration location (e.g. ~/.jupyter).
    sys_prefix : bool [default: False]
        Toggle in the current Python environment's configuration location
        (e.g. ~/.envs/my-env/etc/jupyter).
    """
    config_dir = _get_config_dir(user=user, sys_prefix=sys_prefix)
    cm = BaseJSONConfigManager(parent=parent, config_dir=config_dir)
    cfg = cm.get("jupyter_notebook_config")
    server_extensions = (
        cfg.setdefault("NotebookApp", {})
        .setdefault("nbserver_extensions", {})
    )
    if enabled:
        server_extensions[import_name] = True
    else:
        if enabled is None:
            if import_name not in server_extensions:
                print("server extension not installed")
            else:
                server_extensions[import_name] = not server_extensions[import_name]
        else:
            server_extensions[import_name] = False
    cm.update("jupyter_notebook_config", cfg)


# ----------------------------------------------------------------------
# Applications
# ----------------------------------------------------------------------


flags = {
    "user" : ({
        "ToggleServerExtensionApp" : {
            "user" : True,
        }}, "Install to the user's Jupyter directory"
    ),
    "sys-prefix" : ({
        "ToggleServerExtensionApp" : {
            "sys_prefix" : True,
        }}, "Use sys.prefix as the prefix for installing server extensions"
    ),
    "py" : ({
        "ToggleServerExtensionApp" : {
            "python" : True,
        }}, "Install from a Python package"
    ),
}
flags['python'] = flags['py']


class ToggleServerExtensionApp(BaseNBExtensionApp):

    name = "jupyter serverextension enable/disable"
    description = "Enable/disable a server extension using frontend configuration files."
    
    aliases = {}
    flags = flags

    user = Bool(False, config=True, help="Whether to do a user install")
    sys_prefix = Bool(False, config=True, help="Use the sys.prefix as the prefix")
    python = Bool(False, config=True, help="Install from a Python package")

    def toggle_server_extension(self, import_name):
        toggle_serverextension_python(import_name, self._toggle_value, parent=self, user=self.user, sys_prefix=self.sys_prefix)

    def toggle_server_extension_python(self, package):
        m, server_exts = _get_server_extension_metadata(package)
        for server_ext in server_exts:
            module = server_ext['module']
            self.toggle_server_extension(module)

    def start(self):

        if not self.extra_args:
            sys.exit('Please specify a server extension/package to enable or disable')
        for arg in self.extra_args:
            if self.python:
                self.toggle_server_extension_python(arg)
            else:
                self.toggle_server_extension(arg)


class EnableServerExtensionApp(ToggleServerExtensionApp):

    name = "jupyter serverextension enable"
    description = "Enable a server extension using frontend configuration files."
    _toggle_value = True


class DisableServerExtensionApp(ToggleServerExtensionApp):

    name = "jupyter serverextension disable"
    description = "Disable an serverextension using frontend configuration files."
    _toggle_value = False


class ListServerExtensionsApp(BaseNBExtensionApp):

    name = "jupyter serverextension list"
    version = __version__
    description = "List all server extensions known by the configuration system"

    def list_server_extensions(self):
        config_dirs = jupyter_config_path()
        for config_dir in config_dirs:
            self.log.info('config dir: {}'.format(config_dir))
            cm = BaseJSONConfigManager(parent=self, config_dir=config_dir)
            data = cm.get("jupyter_notebook_config")
            server_extensions = (
                data.setdefault("NotebookApp", {})
                .setdefault("nbserver_extensions", {})
            )
            for x in server_extensions:
                self.log.info('    {1} {0}'.format(x, GREEN_ENABLED if server_extensions[x] else RED_DISABLED))

    def start(self):
        self.list_server_extensions()


_examples = """
jupyter serverextension list                        # list all configured server extensions
jupyter serverextension enable --py <packagename>   # enable all server extensions in a Python package
jupyter serverextension disable --py <packagename>  # disable all server extensions in a Python package
"""


class ServerExtensionApp(BaseNBExtensionApp):

    name = "jupyter serverextension"
    version = __version__
    description = "Work with Jupyter server extensions"
    examples = _examples

    subcommands = dict(
        enable=(EnableServerExtensionApp, "Enable an server extension"),
        disable=(DisableServerExtensionApp, "Disable an server extension"),
        list=(ListServerExtensionsApp, "List server extensions")
    )

    def start(self):
        super(ServerExtensionApp, self).start()

        # The above should have called a subcommand and raised NoStart; if we
        # get here, it didn't, so we should self.log.info a message.
        subcmds = ", ".join(sorted(self.subcommands))
        sys.exit("Please supply at least one subcommand: %s" % subcmds)

main = ServerExtensionApp.launch_instance

# ------------------------------------------------------------------------------
# Private API
# ------------------------------------------------------------------------------


def _get_server_extension_metadata(package):
    m = __import__(package)
    if not hasattr(m, '_jupyter_server_extension_paths'):
        raise KeyError('The Python package {} does not include any valid server extensions'.format(package))
    return m, m._jupyter_server_extension_paths()

if __name__ == '__main__':
    main()
