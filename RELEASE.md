# Making a Release of Notebook

## Using `jupyter_releaser`

The recommended way to make a release is to use [`jupyter_releaser`](https://github.com/jupyter-server/jupyter_releaser#checklist-for-adoption).

## Manual Release Process

### Start from a fresh git checkout and conda environment

#### Set the release branch

```bash
export release_branch=master
```

#### Create the git checkout

```bash
git clone git@github.com:jupyter/notebook.git
cd notebook
git checkout ${release_banch}
```

#### Create and activate the conda environment

```bash
conda create -n notebook-release -c conda-forge jupyter
conda activate notebook-release
```

### Perform a local dev install

```bash
pip install -ve .
```

### Install release dependencies

```bash
conda install -c conda-forge nodejs babel twine build
npm install -g po2json
```

### Update the version

```bash
vim notebook/_version.py
python setup.py jsversion
git commit -am "Release $(python setup.py --version)"
git tag $(python setup.py --version)
```

### Create the artifacts

```bash
rm -rf dist
python -m build .
```

### Upload the artifacts

```bash
twine check dist/* && twine upload dist/*
```

### Change back to dev version

```bash
vim notebook/_version.py   # Add the .dev suffix
python setup.py jsversion
git commit -am "Back to dev version"
```

### Push the commits and tags

```bash
git push origin ${release_branch} --tags
```
