"""Test NotebookApp"""


import logging
import os
from tempfile import NamedTemporaryFile

import nose.tools as nt

from traitlets.tests.utils import check_help_all_output

from jupyter_core.application import NoStart
from ipython_genutils.tempdir import TemporaryDirectory
from traitlets import TraitError
from notebook import notebookapp
NotebookApp = notebookapp.NotebookApp


def test_help_output():
    """ipython notebook --help-all works"""
    check_help_all_output('notebook')

def test_server_info_file():
    td = TemporaryDirectory()
    nbapp = NotebookApp(runtime_dir=td.name, log=logging.getLogger())
    def get_servers():
        return list(notebookapp.list_running_servers(nbapp.runtime_dir))
    nbapp.initialize(argv=[])
    nbapp.write_server_info_file()
    servers = get_servers()
    nt.assert_equal(len(servers), 1)
    nt.assert_equal(servers[0]['port'], nbapp.port)
    nt.assert_equal(servers[0]['url'], nbapp.connection_url)
    nbapp.remove_server_info_file()
    nt.assert_equal(get_servers(), [])

    # The ENOENT error should be silenced.
    nbapp.remove_server_info_file()

def test_nb_dir():
    with TemporaryDirectory() as td:
        app = NotebookApp(notebook_dir=td)
        nt.assert_equal(app.notebook_dir, td)

def test_no_create_nb_dir():
    with TemporaryDirectory() as td:
        nbdir = os.path.join(td, 'notebooks')
        app = NotebookApp()
        with nt.assert_raises(TraitError):
            app.notebook_dir = nbdir

def test_missing_nb_dir():
    with TemporaryDirectory() as td:
        nbdir = os.path.join(td, 'notebook', 'dir', 'is', 'missing')
        app = NotebookApp()
        with nt.assert_raises(TraitError):
            app.notebook_dir = nbdir

def test_invalid_nb_dir():
    with NamedTemporaryFile() as tf:
        app = NotebookApp()
        with nt.assert_raises(TraitError):
            app.notebook_dir = tf

def test_generate_config():
    with TemporaryDirectory() as td:
        app = NotebookApp(config_dir=td)
        app.initialize(['--generate-config'])
        with nt.assert_raises(NoStart):
            app.start()
        assert os.path.exists(os.path.join(td, 'jupyter_notebook_config.py'))
    