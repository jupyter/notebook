# coding: utf-8
"""Utilities for installing server extensions for the notebook"""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from __future__ import print_function


import sys

from jupyter_core.paths import jupyter_config_path
from ._version import __version__
from .nbextensions import (
    BaseNBExtensionApp, ToggleNBExtensionApp, _get_config_dir, _read_config_data,
    _write_config_data
)

from traitlets.config.manager import BaseJSONConfigManager, recursive_update

# ------------------------------------------------------------------------------
# Public API
# ------------------------------------------------------------------------------


class ArgumentConflict(ValueError):
    pass


def enable_server_extension_python(package, user=False, sys_prefix=False):
    """Enable a server extension associated with a Python package."""
    data = _read_config_data(user=user, sys_prefix=sys_prefix)
    server_extensions = (
        data.setdefault("NotebookApp", {})
        .setdefault("server_extensions", [])
    )
    module, server_exts = _get_server_extension_metadata(package)
    for server_ext in server_exts:
        require = server_ext['require']
        if require not in server_extensions:
            server_extensions.append(require)
            diff = {'NotebookApp': {'server_extensions': server_extensions}}
    recursive_update(data, diff)
    _write_config_data(data, user=user, sys_prefix=sys_prefix)


def disable_server_extension_python(package, user=False, sys_prefix=False):
    """Disable a server extension associated with a Python package."""
    data = _read_config_data(user=user, sys_prefix=sys_prefix)
    server_extensions = (
        data.setdefault("NotebookApp", {})
        .setdefault("server_extensions", [])
    )
    module, server_exts = _get_server_extension_metadata(package)
    for server_ext in server_exts:
        require = server_ext['require']
        if require in server_extensions:
            server_extensions.remove(require)
            diff = {'NotebookApp': {'server_extensions': server_extensions}}
    recursive_update(data, diff)
    _write_config_data(data, user=user, sys_prefix=sys_prefix)

# ----------------------------------------------------------------------
# Applications
# ----------------------------------------------------------------------


class ToggleServerExtensionApp(ToggleNBExtensionApp):

    name = "jupyter serverextension enable/disable"
    description = "Enable/disable a server extension using frontend configuration files."

    def _toggle_server_extension(self, require):
        config_dir = _get_config_dir(user=self.user, sys_prefix=self.sys_prefix)
        cm = BaseJSONConfigManager(parent=self, config_dir=config_dir)
        cfg = cm.get("jupyter_notebook_config")
        server_extensions = (
            cfg.setdefault("NotebookApp", {})
            .setdefault("nbserver_extensions", {})
        )
        if self._toggle_value:
            server_extensions[require] = True
        else:
            if self._toggle_value is None:
                if require not in server_extensions:
                    print("server extension not installed")
                else:
                    server_extensions[require] = not server_extensions[require]
            else:
                server_extensions[require] = False
        cm.update("jupyter_notebook_config", cfg)

    def toggle_server_extension_python(self, package):
        m, server_exts = _get_server_extension_metadata(package)
        for server_ext in server_exts:
            require = server_ext['require']
            self._toggle_server_extension(require)

    def toggle_server_extension(self, require):
        self._toggle_server_extension(require)

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
        GREEN_CHECK = '\033[92m✔️\033[0m'
        RED_EX = '\033[91m❌\033[0m'
        
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
                self.log.info('    {1} {0}'.format(x, GREEN_CHECK if server_extensions[x] else RED_EX))

    def start(self):
        self.list_server_extensions()


_examples = """
jupyter serverextension list                            # list all configured nbextensions
jupyter serverextension enable --py <packagename>   # enable all nbextensions in a Python package
jupyter serverextension disable --py <packagename>  # disable all nbextensions in a Python package
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
        raise KeyError('The Python package {} is not a valid server extension'.format(package))
    nbexts = m._jupyter_server_extension_paths()
    return m, nbexts

if __name__ == '__main__':
    main()
