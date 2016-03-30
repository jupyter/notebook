from unittest import TestCase

from traitlets.config.manager import BaseJSONConfigManager
from traitlets.tests.utils import check_help_all_output

from notebook.serverextensions import toggle_serverextension_python
from notebook.nbextensions import _get_config_dir


def test_help_output():
    check_help_all_output('notebook.serverextensions')
    check_help_all_output('notebook.serverextensions', ['enable'])
    check_help_all_output('notebook.serverextensions', ['disable'])
    check_help_all_output('notebook.serverextensions', ['install'])
    check_help_all_output('notebook.serverextensions', ['uninstall'])


class TestInstallServerExtension(TestCase):
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
