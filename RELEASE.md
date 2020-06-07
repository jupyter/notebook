# Making a Release of Notebook

## Start from a fresh git checkout and conda environment

### Set the release branch

```bash
export release_branch=master
```

### Create the git checkout

```bash
git clone git@github.com:jupyter/notebook.git
cd notebook
git checkout ${release_banch}
```

### Create and activate the conda environment

```bash
conda create -n notebook-release -c conda-forge jupyter
conda activate notebook-release
```

## Perform a local dev install

```bash
pip install -ve .
```

## Install release dependencies

```bash
conda install -c conda-forge nodejs babel twine
npm install -g po2json
```

## Update the version

```bash
vim notebook/_version.py
python setup.py jsversion
git commit -am "Release $(python setup.py --version)"
git tag $(python setup.py --version)
```

## Create the artifacts

```bash
rm -rf dist
python setup.py sdist
python setup.py bdist_wheel
```

## Upload the artifacts

```bash
twine check dist/* && twine upload dist/*
```

## Change back to dev version

```bash
vim notebook/_version.py   # Add the .dev suffix
python setup.py jsversion
git commit -am "Back to dev version"
```

## Push the commits and tags

```bash
git push origin ${release_branch} --tags
```
