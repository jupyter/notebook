
`View the original notebook on nbviewer <http://nbviewer.jupyter.org/github/jupyter/notebook/blob/master/docs/source/examples/Notebook/Connecting%20with%20the%20Qt%20Console.ipynb>`__

Connecting to an existing IPython kernel using the Qt Console
=============================================================

The Frontend/Kernel Model
-------------------------

The traditional IPython (``ipython``) consists of a single process that
combines a terminal based UI with the process that runs the users code.

While this traditional application still exists, the modern Jupyter
consists of two processes:

-  Kernel: this is the process that runs the users code.
-  Frontend: this is the process that provides the user interface where
   the user types code and sees results.

Jupyter currently has 3 frontends:

-  Terminal Console (``ipython console``)
-  Qt Console (``ipython qtconsole``)
-  Notebook (``ipython notebook``)

The Kernel and Frontend communicate over a ZeroMQ/JSON based messaging
protocol, which allows multiple Frontends (even of different types) to
communicate with a single Kernel. This opens the door for all sorts of
interesting things, such as connecting a Console or Qt Console to a
Notebook's Kernel. For example, you may want to connect a Qt console to
your Notebook's Kernel and use it as a help browser, calling ``??`` on
objects in the Qt console (whose pager is more flexible than the one in
the notebook).

This Notebook describes how you would connect another Frontend to a
Kernel that is associated with a Notebook.

Manual connection
-----------------

To connect another Frontend to a Kernel manually, you first need to find
out the connection information for the Kernel using the
``%connect_info`` magic:

.. code:: python

    %connect_info

You can see that this magic displays everything you need to connect to
this Notebook's Kernel.

Automatic connection using a new Qt Console
-------------------------------------------

You can also start a new Qt Console connected to your current Kernel by
using the ``%qtconsole`` magic. This will detect the necessary
connection information and start the Qt Console for you automatically.

.. code:: python

    a = 10

.. code:: python

    %qtconsole

`View the original notebook on nbviewer <http://nbviewer.jupyter.org/github/jupyter/notebook/blob/master/docs/source/examples/Notebook/Connecting%20with%20the%20Qt%20Console.ipynb>`__
