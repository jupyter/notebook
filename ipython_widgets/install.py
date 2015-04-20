#!/usr/bin/env python
# Thanks @takluyver for your cite2c install.py.
from os.path import dirname, abspath, join as pjoin
from jupyter_notebook.nbextensions import install_nbextension
from jupyter_notebook.services.config import ConfigManager

print("Installing nbextension ...")
staticdir = pjoin(dirname(abspath(__file__)), 'static')
install_nbextension(staticdir, destination='widgets', user=False)

print("Enabling the extension ...")
cm = ConfigManager()
cm.update('notebook', {"load_extensions": {"widgets/notebook/js/extension": True}})

print("Done.")
