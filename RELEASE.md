# Making a new release of JupyterLab Classic

This process is still a bit manual and consists in running a couple of commands.

This should normally be possible to automate the process at some point.

## Getting a clean environment

Creating a new environment can help avoid pushing local changes and any extra tag.

```bash
mamba create -q -y -n jupyterlab-classic-release -c conda-forge twine nodejs -y
conda activate jupyterlab-classic-release
```

Alternatively, the local repository can be cleaned with:

```bash
git clean -fdx
```

## Releasing on PyPI

Make sure the `dist/` folder is empty.

1. Update [jupyterlab_classic/\_version.py](./jupyterlab_classic/_version.py) with the new version number
2. Run: `python setup.py sdist bdist_wheel`
3. Double check the size of the bundles in the `dist/` folder
4. Test the release by installing the wheel or sdist: `python -m pip install ./dist/jupyterlab_classic-0.1.1-py3-none-any.whl
5. Commit the changes

- `git add jupyterlab_classic/_version.py`
- `git commit -m "Release x.y.z"`

5. `export TWINE_USERNAME=mypypi_username`
6. `twine upload dist/*`

## Publish the packages to npm

1. Bump the version in
2. `jlpm run lerna version x.y.z --no-push --amend --force-publish`
3. `jlpm run lerna publish from-package`

## Committing and tagging

Push the release commit to the `main` branch:

```bash
git push origin main
```

Then create a new release from the GitHub interface.
