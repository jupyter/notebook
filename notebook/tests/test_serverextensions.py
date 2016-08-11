import os
from unittest import TestCase
try:
    from unittest.mock import patch
except ImportError:
    from mock import patch # py2

from ipython_genutils.tempdir import TemporaryDirectory
from ipython_genutils import py3compat

from traitlets.config.manager import BaseJSONConfigManager
from traitlets.tests.utils import check_help_all_output

from notebook.serverextensions import toggle_serverextension_python
from notebook import nbextensions
from notebook.nbextensions import _get_config_dir


def test_help_output():
    check_help_all_output('notebook.serverextensions')
    check_help_all_output('notebook.serverextensions', ['enable'])
    check_help_all_output('notebook.serverextensions', ['disable'])
    check_help_all_output('notebook.serverextensions', ['install'])
    check_help_all_output('notebook.serverextensions', ['uninstall'])


class TestInstallServerExtension(TestCase):
    
    def tempdir(self):
        td = TemporaryDirectory()
        self.tempdirs.append(td)
        return py3compat.cast_unicode(td.name)

    def setUp(self):
        self.tempdirs = []

        self.test_dir = self.tempdir()
        self.data_dir = os.path.join(self.test_dir, 'data')
        self.config_dir = os.path.join(self.test_dir, 'config')
        self.system_data_dir = os.path.join(self.test_dir, 'system_data')
        self.system_path = [self.system_data_dir]
        
        self.patch_env = patch.dict('os.environ', {
            'JUPYTER_CONFIG_DIR': self.config_dir,
            'JUPYTER_DATA_DIR': self.data_dir,
        })
        self.patch_env.start()
        self.patch_system_path = patch.object(nbextensions,
            'SYSTEM_JUPYTER_PATH', self.system_path)
        self.patch_system_path.start()
    
    def tearDown(self):
        self.patch_env.stop()
        self.patch_system_path.stop()

    def _inject_mock_extension(self):
        outer_file = __file__

        class mock():
            __file__ = outer_file

            @staticmethod
            def _jupyter_server_extension_paths():
                return [{
                    'module': '_mockdestination/index'
                }]

        import sys
        sys.modules['mockextension'] = mock

    def _get_config(self, user=True):
        cm = BaseJSONConfigManager(config_dir=_get_config_dir(user))
        data = cm.get("jupyter_notebook_config")
        return data.get("NotebookApp", {}).get("nbserver_extensions", {})

    def test_enable(self):
        self._inject_mock_extension()
        toggle_serverextension_python('mockextension', True)

        config = self._get_config()
        assert config['mockextension']

    def test_disable(self):
        self._inject_mock_extension()
        toggle_serverextension_python('mockextension', True)
        toggle_serverextension_python('mockextension', False)

        config = self._get_config()
        assert not config['mockextension']
