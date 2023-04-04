(development-faq)=

# Developer FAQ

1. How do I install a prerelease version such as a beta or release candidate?

You can install a prerelease version of the notebook using the `--pre` flag with `pip`:

```bash
python -m pip install notebook --pre --upgrade
```

If you are using `conda` or `mamba`, you can install a prerelease version of the notebook using the alpha or beta label. For example, to install the latest alpha release, you can run:

```bash
conda install -c conda-forge -c conda-forge/label/notebook_alpha notebook=7.0.0a18
```
