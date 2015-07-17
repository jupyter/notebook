.. _extending:

======================
Extending the Notebook
======================

Certain subsystems of the notebook server are designed to be extended or
overridden by users.  This document explains these systems and shows how to
override the notebook's defaults with your own custom behavior.

Contents API
------------

.. currentmodule:: notebook.services.contents

The Jupyter Notebook web application provides a graphical interface for
creating, opening, renaming, and deleting files in a virtual filesystem.

The :class:`ContentsManager<manager.ContentsManager>` class defines an abstract
API for translating these interactions into operations on a particular storage
medium. The default implementation,
:class:`FileContentsManager<filemanager.FileContentsManager>`, uses the local
filesystem of the server for storage and straightforwardly serializes notebooks
into JSON.  Users can override these behaviors by supplying custom subclasses
of `ContentsManager`

This section describes the **Contents API**,

Data Model
^^^^^^^^^^

.. currentmodule:: notebook.services.contents.manager

API Paths
'''''''''
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
* The root directory is represented with the empty string.

Filesystem Entities
'''''''''''''''''''
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
|**created**         |unicode    |Creation date of the entity,  |
|                    |           |as ISO-8601 string.           |
|                    |           |                              |
+--------------------+-----------+------------------------------+
|**last_modified**   |unicode    |Last modified date of the     |
|                    |           |entity, as ISO-8601 string.   |
|                    |           |                              |
+--------------------+-----------+------------------------------+
|**content**         |variable   |The "content" of the entity.  |
|                    |           |(:ref:`See                    |
|                    |           |Below<modelcontent>`)         |
+--------------------+-----------+------------------------------+
|**mimetype**        |unicode or |The mimetype of ``"content"``,|
|                    |``None``   |if any.  (:ref:`See           |
|                    |           |Below<modelcontent>`)         |
+--------------------+-----------+------------------------------+
|**format**          |unicode or |The format of ``"content"``,  |
|                    |``None``   |if any. (:ref:`See            |
|                    |           |Below<modelcontent>`)         |
+--------------------+-----------+------------------------------+

.. _modelcontent:

The **"content"** field

In certain circumstances, we may not need the full content of an entity to
complete a Contents API request.  require the full content of a filesystem
entity.  For example, if we want to list the entries in directory ""foo/bar",
we don't want to include the data stored in each file

A sample model looks as follows:

.. sourcecode:: python

   {
       "name": "My Notebook.ipynb",
       "path": "foo/bar/My Notebook.ipynb",
       "type": "notebook",
       "writable": "true",
       "created": "2013-10-01T14:22:36.123456+00:00",
       "last_modified": "2013-10-02T11:29:27.616675+00:00",
       "mimetype": None,
       "content": None,
       "format": None,
   }

Writing a Custom ContentsManager
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Required Methods
''''''''''''''''

A minimal complete implementation of a custom
:class:`ContentsManager<manager.ContentsManager>` must implement the following
methods:

.. autosummary::
   ContentsManager.get
   ContentsManager.save
   ContentsManager.delete_file
   ContentsManager.rename_file
   ContentsManager.file_exists
   ContentsManager.dir_exists
   ContentsManager.is_hidden

Testing
'''''''
.. currentmodule:: notebook.services.contents.tests

:mod:`notebook.services.contents.tests` includes several test suites written
against the abstract Contents API.  This means that an excellent way to test a
new ContentsManager subclass is to subclass our tests (**!**) to make them use
your ContentsManager.
