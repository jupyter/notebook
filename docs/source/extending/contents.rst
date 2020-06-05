.. _contents_api:

Contents API
============

.. currentmodule:: notebook.services.contents

The Jupyter Notebook web application provides a graphical interface for
creating, opening, renaming, and deleting files in a virtual filesystem.

The :class:`~manager.ContentsManager` class defines an abstract
API for translating these interactions into operations on a particular storage
medium. The default implementation,
:class:`~filemanager.FileContentsManager`, uses the local
filesystem of the server for storage and straightforwardly serializes notebooks
into JSON.  Users can override these behaviors by supplying custom subclasses
of ContentsManager.

This section describes the interface implemented by ContentsManager subclasses.
We refer to this interface as the **Contents API**.

Data Model
----------

.. currentmodule:: notebook.services.contents.manager

Filesystem Entities
~~~~~~~~~~~~~~~~~~~
.. _notebook models:

ContentsManager methods represent virtual filesystem entities as dictionaries,
which we refer to as **models**.

Models may contain the following entries:

+--------------------+-----------+------------------------------+
| Key                | Type      |Info                          |
+====================+===========+==============================+
|**name**            |unicode    |Basename of the entity.       |
+--------------------+-----------+------------------------------+
|**path**            |unicode    |Full                          |
|                    |           |(:ref:`API-style<apipaths>`)  |
|                    |           |path to the entity.           |
+--------------------+-----------+------------------------------+
|**type**            |unicode    |The entity type. One of       |
|                    |           |``"notebook"``, ``"file"`` or |
|                    |           |``"directory"``.              |
+--------------------+-----------+------------------------------+
|**created**         |datetime   |Creation date of the entity.  |
+--------------------+-----------+------------------------------+
|**last_modified**   |datetime   |Last modified date of the     |
|                    |           |entity.                       |
+--------------------+-----------+------------------------------+
|**content**         |variable   |The "content" of the entity.  |
|                    |           |(:ref:`See                    |
|                    |           |Below<modelcontent>`)         |
+--------------------+-----------+------------------------------+
|**mimetype**        |unicode or |The mimetype of ``content``,  |
|                    |``None``   |if any.  (:ref:`See           |
|                    |           |Below<modelcontent>`)         |
+--------------------+-----------+------------------------------+
|**format**          |unicode or |The format of ``content``,    |
|                    |``None``   |if any. (:ref:`See            |
|                    |           |Below<modelcontent>`)         |
+--------------------+-----------+------------------------------+

.. _modelcontent:

Certain model fields vary in structure depending on the ``type`` field of the
model. There are three model types: **notebook**, **file**, and **directory**.

- ``notebook`` models
    - The ``format`` field is always ``"json"``.
    - The ``mimetype`` field is always ``None``.
    - The ``content`` field contains a
      :class:`nbformat.notebooknode.NotebookNode` representing the .ipynb file
      represented by the model.  See the `NBFormat`_ documentation for a full
      description.

- ``file`` models
    - The ``format`` field is either ``"text"`` or ``"base64"``.
    - The ``mimetype`` field can be any mimetype string, but defaults to 
      ``text/plain`` for text-format models and
      ``application/octet-stream`` for base64-format models. For files with
      unknown mime types (e.g. unknown file extensions), this field may be
      `None`.
    - The ``content`` field is always of type ``unicode``.  For text-format
      file models, ``content`` simply contains the file's bytes after decoding
      as UTF-8.  Non-text (``base64``) files are read as bytes, base64 encoded,
      and then decoded as UTF-8.

- ``directory`` models
    - The ``format`` field is always ``"json"``.
    - The ``mimetype`` field is always ``None``.
    - The ``content`` field contains a list of :ref:`content-free<contentfree>`
      models representing the entities in the directory.

.. note::

   .. _contentfree:

   In certain circumstances, we don't need the full content of an entity to
   complete a Contents API request. In such cases, we omit the ``content``, and
   ``format`` keys from the model. The default values for the ``mimetype``
   field will might also not be evaluated, in which case it will be set as `None`.
   This reduced reply most commonly occurs when listing a directory, in
   which circumstance we represent files within the directory as content-less
   models to avoid having to recursively traverse and serialize the entire
   filesystem.

**Sample Models**

.. code-block:: python

    # Notebook Model with Content
    {
        'content': {
            'metadata': {},
            'nbformat': 4,
            'nbformat_minor': 0,
            'cells': [
                {
                    'cell_type': 'markdown',
                    'metadata': {},
                    'source': 'Some **Markdown**',
                },
            ],
        },
        'created': datetime(2015, 7, 25, 19, 50, 19, 19865),
        'format': 'json',
        'last_modified': datetime(2015, 7, 25, 19, 50, 19, 19865),
        'mimetype': None,
        'name': 'a.ipynb',
        'path': 'foo/a.ipynb',
        'type': 'notebook',
        'writable': True,
    }

    # Notebook Model without Content
    {
        'content': None,
        'created': datetime.datetime(2015, 7, 25, 20, 17, 33, 271931),
        'format': None,
        'last_modified': datetime.datetime(2015, 7, 25, 20, 17, 33, 271931),
        'mimetype': None,
        'name': 'a.ipynb',
        'path': 'foo/a.ipynb',
        'type': 'notebook',
        'writable': True
    }


API Paths
~~~~~~~~~
.. _apipaths:

ContentsManager methods represent the locations of filesystem resources as
**API-style paths**.  Such paths are interpreted as relative to the root
directory of the notebook server.  For compatibility across systems, the
following guarantees are made:

* Paths are always ``unicode``, not ``bytes``.
* Paths are not URL-escaped.
* Paths are always forward-slash (/) delimited, even on Windows.
* Leading and trailing slashes are stripped.  For example, ``/foo/bar/buzz/``
  becomes ``foo/bar/buzz``.
* The empty string (``""``) represents the root directory.


Writing a Custom ContentsManager
--------------------------------

The default ContentsManager is designed for users running the notebook as an
application on a personal computer.  It stores notebooks as .ipynb files on the
local filesystem, and it maps files and directories in the Notebook UI to files
and directories on disk.  It is possible to override how notebooks are stored
by implementing your own custom subclass of ``ContentsManager``. For example,
if you deploy the notebook in a context where you don't trust or don't have
access to the filesystem of the notebook server, it's possible to write your
own ContentsManager that stores notebooks and files in a database.


Required Methods
~~~~~~~~~~~~~~~~

A minimal complete implementation of a custom
:class:`~manager.ContentsManager` must implement the following
methods:

.. autosummary::
   ContentsManager.get
   ContentsManager.save
   ContentsManager.delete_file
   ContentsManager.rename_file
   ContentsManager.file_exists
   ContentsManager.dir_exists
   ContentsManager.is_hidden

You may be required to specify a Checkpoints object, as the default one,
``FileCheckpoints``, could be incompatible with your custom 
ContentsManager.


Chunked Saving
~~~~~~~~~~~~~~

The contents API allows for "chunked" saving of files, i.e.
saving/transmitting in partial pieces:

* This can only be used when the ``type`` of the model is ``file``.
* The model should be as otherwise expected for
  :meth:`~manager.ContentsManager.save`, with an added field ``chunk``.
* The value of ``chunk`` should be an integer starting at ``1``, and incrementing
  for each subsequent chunk, except for the final chunk, which should be
  indicated with a value of ``-1``.
* The model returned from using :meth:`~manager.ContentsManager.save` with
  ``chunk`` should be treated as unreliable for all chunks except the final one.
* Any interaction with a file being saved in a chunked manner is unreliable
  until the final chunk has been saved. This includes directory listings.


Customizing Checkpoints
-----------------------
.. currentmodule:: notebook.services.contents.checkpoints

Customized Checkpoint definitions allows behavior to be 
altered and extended.

The ``Checkpoints`` and ``GenericCheckpointsMixin`` classes
(from :mod:`notebook.services.contents.checkpoints`)
have reusable code and are intended to be used together, 
but require the following methods to be implemented.

.. autosummary::
   Checkpoints.rename_checkpoint
   Checkpoints.list_checkpoints
   Checkpoints.delete_checkpoint
   GenericCheckpointsMixin.create_file_checkpoint
   GenericCheckpointsMixin.create_notebook_checkpoint
   GenericCheckpointsMixin.get_file_checkpoint
   GenericCheckpointsMixin.get_notebook_checkpoint

No-op example
~~~~~~~~~~~~~

Here is an example of a no-op checkpoints object - note the mixin
comes first. The docstrings indicate what each method should do or 
return for a more complete implementation.

.. code-block:: python

    class NoOpCheckpoints(GenericCheckpointsMixin, Checkpoints):
        """requires the following methods:"""
        def create_file_checkpoint(self, content, format, path):
            """ -> checkpoint model"""
        def create_notebook_checkpoint(self, nb, path):
            """ -> checkpoint model"""
        def get_file_checkpoint(self, checkpoint_id, path):
            """ -> {'type': 'file', 'content': <str>, 'format': {'text', 'base64'}}"""
        def get_notebook_checkpoint(self, checkpoint_id, path):
            """ -> {'type': 'notebook', 'content': <output of nbformat.read>}"""
        def delete_checkpoint(self, checkpoint_id, path):
            """deletes a checkpoint for a file"""
        def list_checkpoints(self, path):
            """returns a list of checkpoint models for a given file, 
            default just does one per file
            """
            return []
        def rename_checkpoint(self, checkpoint_id, old_path, new_path):
            """renames checkpoint from old path to new path"""

See ``GenericFileCheckpoints`` in :mod:`notebook.services.contents.filecheckpoints`
for a more complete example.

Testing
-------
.. currentmodule:: notebook.services.contents.tests

:mod:`notebook.services.contents.tests` includes several test suites written
against the abstract Contents API.  This means that an excellent way to test a
new ContentsManager subclass is to subclass our tests to make them use your
ContentsManager.

.. note::

   PGContents_ is an example of a complete implementation of a custom
   ``ContentsManager``.  It stores notebooks and files in PostgreSQL_ and encodes
   directories as SQL relations.  PGContents also provides an example of how to
   re-use the notebook's tests.

.. _NBFormat: https://nbformat.readthedocs.io/en/latest/index.html
.. _PGContents: https://github.com/quantopian/pgcontents
.. _PostgreSQL: https://www.postgresql.org/
