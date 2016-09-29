import os
import sys
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
from notebook.notebookapp import NotebookApp
from notebook.nbextensions import _get_config_dir

if sys.version_info > (3,):
    from types import SimpleNamespace
else:
    class SimpleNamespace(object):
        pass

from collections import OrderedDict


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


class TestOrderedServerExtension(TestCase):
    """
    Test that Server Extensions are loaded _in order_
    """

    def setUp(self):
        mockextension1 = SimpleNamespace()
        mockextension2 = SimpleNamespace()

        def load_jupyter_server_extension(obj):
            obj.mockI = True
            obj.mock_shared = 'I'

        mockextension1.load_jupyter_server_extension = load_jupyter_server_extension

        def load_jupyter_server_extension(obj):
            obj.mockII = True
            obj.mock_shared = 'II'

        mockextension2.load_jupyter_server_extension = load_jupyter_server_extension

        sys.modules['mockextension2'] = mockextension2
        sys.modules['mockextension1'] = mockextension1

    def tearDown(self):
        del sys.modules['mockextension2']
        del sys.modules['mockextension1']


    def test_load_ordered(self):
        app = NotebookApp()
        app.nbserver_extensions = OrderedDict([('mockextension2',True),('mockextension1',True)])

        app.init_server_extensions()

        assert app.mockII is True, "Mock II should have been loaded"
        assert app.mockI is True, "Mock I should have been loaded"
        assert app.mock_shared == 'II', "Mock II should be loaded after Mock I"
