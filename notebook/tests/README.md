# IPython Notebook JavaScript Tests

This directory includes regression tests for the web notebook. These tests
depend on [CasperJS](http://casperjs.org/), which in turn requires a recent
version of [PhantomJS](http://phantomjs.org/).

The JavaScript tests are organized into subdirectories that match those in
`static` (`base`, `notebook`, `services`, `tree`, etc.).

To run all of the JavaScript tests do:

```
python -m notebook.jstest 
```

To run the JavaScript tests for a specific file (`base/utils.js` in this case)
do:

```
python -m notebook.jstest base/utils.js
```

The file `jstest.py` will automatically launch a notebook server to run the
tests against. You can however specify the url of a running notebook server
by using `--url=http://localhost:8888`.
