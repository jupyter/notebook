# Jupyter Notebook

The Jupyter HTML notebook is a web-based notebook environment for interactive computing.

Dev quickstart:

* ensure that you have node/npm installed (e.g. `brew install node` on OS X)
* Clone this repo and cd into it
* `pip install --pre -e .`

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
pip install --pre -e .
jupyter notebook
```

## Working on the frontend
The Notebook frontend depends on a wide set of libraries and package managers.
NPM is used to macro manage the frontend build process.  You can build the 
frontend Javascript and LESS by running

```
npm run build
```

If you need to build the Javascript alone

```
npm run build:js
```

Or LESS

```
npm run build:css
```

To build specific sub components, separate using a colon.  i.e. to build only
the terminal's Javascript

```
npm run build:js:terminal
```

To clean all built output

```
npm run clean
```
