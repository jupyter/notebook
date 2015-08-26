# Jupyter Notebook

The Jupyter HTML notebook is a web-based notebook environment for interactive computing.

Dev quickstart:

* ensure that you have node/npm installed (e.g. `brew install node` on OS X)
* Clone this repo and cd into it
* `pip install pre -e .`

_NOTE_: For Debian/Ubuntu systems, if you're installing the system node you need
to use the 'nodejs-legacy' package and not the 'node' package.

Launch with:

    jupyter notebook

Example installation (tested on Ubuntu Trusty):

```
sudo apt-get install nodejs-legacy npm python-virtualenv python-dev
# ensure setuptools/pip are up-to-date
pip install --upgrade setuptools pip
git clone https://github.com/jupyter/notebook.git
cd notebook
pip install -e .
jupyter notebook
```

See [documentation](http://jupyter-notebook.readthedocs.org/en/latest/development.html) for more info on how to run developement version.
