.. _htmlnotebook:

NbClassic and Notebook
======================

NbClassic in the Jupyter Ecosystem
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Read more details about the changes currently taking place in the
Jupyter Ecosystem in this `team-compass issue`_.

Any extension developed for Notebook < 7 or NbClassic will not be
compatible with Notebook 7 and upwards.

**NbClassic and Notebook 7**

You can install NbClassic, Notebook 7 and JupyterLab, all three of
which will provide different user interfaces
on the same server. When Notebook 7 is available, the NbClassic UI, will
be served at the ``/nbclassic/tree`` base path rather than the 
base path ``/tree`` used otherwise. If you are using Notebook 7 along 
with NbClassic, you will also have JupyterLab installed as it is a 
dependency of Notebook 7, and these front ends will be available 
through the following base paths: JupyterLab at ``/lab``, Notebook 7 at 
``/tree``, and NbClassic at ``/nbclassic/tree``.

**NbClassic and Notebook 6.5.x**

As NbClassic provides the static assets for Notebook 6.5.x, while
having both installed should cause no issues, the user interface provided
by these two packages will be the same. These UIs will be served by
different back end servers. An NbClassic instance will be at a server with the 
``/tree`` path and opening a Notebook 6.5.x instance will open on a 
different server with the ``/tree`` path as well, presenting the same 
static assets. When starting an instance of JupyterLab you will be able 
to access the classic view of Notebook with NbClassic served on the same 
server at ``/tree``. 

**NbClassic and Notebook <= 6.4.x**

When using NbClassic and Notebook <= 6.4.x you can expect that these UIs
will not be only presented at different servers, meaning they will both 
be available at their respective server under ``/tree`` but they 
may also differ as potential changes to the NbClassic UI will not be 
reflected in Notebook versions <= 6.4.x. In this case as well, you would 
be able to access the classic view of Notebook with NbClassic served on 
the same server, at ``/tree``.

**NbClassic and JupyterLab 3.x**

When only JupyterLab 3.x is installed, then NbClassic does not have to be 
explicitly installed as JupyterLab 3.x depends on it. They will run on 
the same server, and are reachable via ``/tree`` for NbClassic and 
``/lab`` for JupyterLab.

**NbClassic and JupyterLab 4.x**

When only JupyterLab 4.x is installed, then NbClassic has to be installed 
explictly. They will run on the same server, and are reachable via 
``/tree`` for NbClassic, and ``/lab`` for JupyterLab.

**NbClassic Independently**

When you choose to install only NbClassic via ``pip install nbclassic``, 
the classic Notebook UI will be presented at the ``/tree`` path. As the 
other frontends are not installed, attempting to access the other paths 
will return errors. Note that NbClassic being a Jupyter Server extension, 
indicated Jupyter Server will be available. This provides an additional 
way to view the NbClassic frontend. You would be able to  manually 
enable the extension when running an instance of Jupyter Server, 
``> jupyter server --ServerApp.jpserver_extensions="nbclassic=True"``, 
which will provide the NbClassic frontend at ``/tree`` path when visited.

.. _team-compass issue: https://github.com/jupyter/notebook-team-compass/issues/5#issuecomment-1085254000
