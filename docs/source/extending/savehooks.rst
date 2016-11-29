File save hooks
===============

You can configure functions that are run whenever a file is saved. There are
two hooks available:

* ``ContentsManager.pre_save_hook`` runs on the API path and model with
  content. This can be used for things like stripping output that people don't
  like adding to VCS noise.
* ``FileContentsManager.post_save_hook`` runs on the filesystem path and model
  without content. This could be used to commit changes after every save, for
  instance.

They are both called with keyword arguments::

    pre_save_hook(model=model, path=path, contents_manager=cm)
    post_save_hook(model=model, os_path=os_path, contents_manager=cm)

Examples
--------

These can both be added to :file:`jupyter_notebook_config.py`.

A pre-save hook for stripping output::

    def scrub_output_pre_save(model, **kwargs):
        """scrub output before saving notebooks"""
        # only run on notebooks
        if model['type'] != 'notebook':
            return
        # only run on nbformat v4
        if model['content']['nbformat'] != 4:
            return

        for cell in model['content']['cells']:
            if cell['cell_type'] != 'code':
                continue
            cell['outputs'] = []
            cell['execution_count'] = None

    c.FileContentsManager.pre_save_hook = scrub_output_pre_save

A post-save hook to make a script equivalent whenever the notebook is saved
(replacing the ``--script`` option in older versions of the notebook):

.. code-block:: python

    import io
    import os
    from notebook.utils import to_api_path

    _script_exporter = None

    def script_post_save(model, os_path, contents_manager, **kwargs):
        """convert notebooks to Python script after save with nbconvert

        replaces `ipython notebook --script`
        """
        from nbconvert.exporters.script import ScriptExporter

        if model['type'] != 'notebook':
            return

        global _script_exporter

        if _script_exporter is None:
            _script_exporter = ScriptExporter(parent=contents_manager)

        log = contents_manager.log

        base, ext = os.path.splitext(os_path)
        py_fname = base + '.py'
        script, resources = _script_exporter.from_filename(os_path)
        script_fname = base + resources.get('output_extension', '.txt')
        log.info("Saving script /%s", to_api_path(script_fname, contents_manager.root_dir))

        with io.open(script_fname, 'w', encoding='utf-8') as f:
            f.write(script)

    c.FileContentsManager.post_save_hook = script_post_save


This could be a simple call to ``jupyter nbconvert --to script``, but spawning
the subprocess every time is quite slow.
