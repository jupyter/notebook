# Releasing Jupyter Notebook

## Using `jupyter_releaser`

The recommended way to make a release is to use [`jupyter_releaser`](https://jupyter-releaser.readthedocs.io/en/latest/get_started/making_release_from_repo.html).

## Manual Release

To create a manual release, perform the following steps:

### Set up

```bash
pip install hatch twine
git pull origin $(git branch --show-current)
git clean -dffx
```

### Update the version and apply the tag

```bash
echo "Enter new version"
read new_version
hatch version ${new_version}
git tag -a ${new_version} -m "Release ${new_version}"
```

### Build the artifacts

```bash
rm -rf dist
hatch build
```

### Publish the artifacts to pypi

```bash
twine check dist/*
twine upload dist/*
```
