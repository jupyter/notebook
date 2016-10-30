"""Manager to read and modify frontend config data in JSON files.
"""
# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import os.path

from traitlets.config.manager import BaseJSONConfigManager, recursive_update
from jupyter_core.paths import jupyter_config_dir, jupyter_config_path
from traitlets import Unicode, Instance, List
from traitlets.config import LoggingConfigurable


class ConfigManager(LoggingConfigurable):
    """Config Manager used for storing notebook frontend config"""

    # Public API

    def get(self, section_name):
        """Get the config from all config sections."""
        config = {}
        # step through back to front, to ensure front of the list is top priority
        for p in self.read_config_path[::-1]:
            cm = BaseJSONConfigManager(config_dir=p)
            recursive_update(config, cm.get(section_name))
        return config

    def set(self, section_name, data):
        """Set the config only to the user's config."""
        return self.write_config_manager.set(section_name, data)

    def update(self, section_name, new_data):
        """Update the config only to the user's config."""
        return self.write_config_manager.update(section_name, new_data)

    # Private API

    read_config_path = List(Unicode())
    def _read_config_path_default(self):
        return [os.path.join(p, 'nbconfig') for p in jupyter_config_path()]

    write_config_dir = Unicode()
    def _write_config_dir_default(self):
        return os.path.join(jupyter_config_dir(), 'nbconfig')

    write_config_manager = Instance(BaseJSONConfigManager)
    def _write_config_manager_default(self):
        return BaseJSONConfigManager(config_dir=self.write_config_dir)

    def _write_config_dir_changed(self, name, old, new):
        self.write_config_manager = BaseJSONConfigManager(config_dir=self.write_config_dir)
