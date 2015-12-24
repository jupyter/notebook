"""Manager to read and modify frontend config data in JSON files.
"""
# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import os.path

from traitlets.config.manager import BaseJSONConfigManager
from jupyter_core.paths import jupyter_config_dir
from traitlets import Unicode

import warnings

class ConfigManager(BaseJSONConfigManager):
    """Config Manager used for storing notebook frontend config"""

    def __init__(self, **kwargs):

        if kwargs.get('config_dir', None) is not None:
            warnings.warn('ConfigManager `config_dir` kwarg will likely have no effect and might be removed in future Notebook versions.')
        super(ConfigManager, self).__init__(**kwargs)
            
    
    config_dir = Unicode(config=True)
    def _config_dir_default(self):
        return os.path.join(jupyter_config_dir(), 'nbconfig')
