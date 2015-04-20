#!/usr/bin/env python
# Thanks @takluyver for your cite2c install.py.
from os.path import dirname, abspath, join as pjoin
from jupyter_notebook.nbextensions import install_nbextension
from jupyter_notebook.services.config import ConfigManager
import argparse

parser = argparse.ArgumentParser(description="Installs the IPython widgets")
parser.add_argument("-u", "--user", help="Install as current user", action="store_true")
parser.add_argument("-s", "--symlink", help="Symlink instead of copying files", action="store_true")
args = parser.parse_args()

print("Installing nbextension ...")
staticdir = pjoin(dirname(abspath(__file__)), 'static')
install_nbextension(staticdir, destination='widgets', user=args.user, symlink=args.symlink)

print("Enabling the extension ...")
cm = ConfigManager()
cm.update('notebook', {"load_extensions": {"widgets/notebook/js/extension": True}})

print("Done.")
