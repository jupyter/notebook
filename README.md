# Jupyter Notebook

The Jupyter HTML notebook is a web-based notebook environment for interactive computing.

Dev quickstart:

* Create a virtual env (ie jupyter-dev)
* ensure that you have node/npm installed (ie brew install node on OS X)
* Clone this repo and cd into it
* pip install -r requirements.txt
* pip install -e .

_NOTE_: For Debian/Ubuntu systems, if you're installing the system node you need
to use the 'nodejs-legacy' package and not the 'node' package.

Launch with:

    jupyter notebook

For Ubuntu Trusty:
```
sudo apt-get install nodejs-legacy npm python-virtualenv python-dev
python2 -m virtualenv ~/.virtualenvs/jupyter_notebook
source ~/.virtualenvs/jupyter_notebook/bin/activate
pip install --upgrade setuptools pip
git clone https://github.com/jupyter/jupyter_notebook.git
cd jupyter_notebook
pip install -r requirements.txt -e .
jupyter notebook
```

