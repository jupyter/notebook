# Jupyter Notebook

The Jupyter HTML notebook is a web-based notebook environment for interactive computing.

Dev quickstart:

* Create a virtual env (ie jupyter-dev)
* ensure that you have node/npm installed (ie brew install node on OS X)
* Clone this repo and cd into it
* pip install -r requirements.txt -e .

_NOTE_: For Debian/Ubuntu systems, if you're installing the system node you need
to use the 'nodejs-legacy' package and not the 'node' package.

Launch with:

    jupyter notebook

For Ubuntu Trusty:
```
sudo apt-get install nodejs-legacy npm python-virtualenv python-dev
python2 -m virtualenv ~/.virtualenvs/notebook
source ~/.virtualenvs/notebook/bin/activate
pip install --upgrade setuptools pip
git clone https://github.com/jupyter/notebook.git
cd notebook
pip install -r requirements.txt -e .
jupyter notebook
```

For FreeBSD:
```
cd /usr/ports/www/npm
sudo make install    # (Be sure to select the "NODE" option)
cd /usr/ports/devel/py-pip
sudo make install
cd /usr/ports/devel/py-virtualenv
sudo make install
cd /usr/ports/shells/bash
sudo make install
mkdir -p ~/.virtualenvs
python2.7 -m virtualenv ~/.virtualenvs/notebook
bash
source ~/.virtualenvs/notebook/bin/activate
pip install --upgrade setuptools pip pycurl
git clone https://github.com/jupyter/notebook.git
cd notebook
pip install -r requirements.txt -e .
jupyter notebook
```
