.. _development_faq:

Developer FAQ
=============

1. How do I install a pre-release version such as a beta or release candidate?

.. code-block:: bash

    python -m pip install notebook --pre --upgrade

2. What are the basic steps for a development install?

.. code-block:: bash

    git clone https://github.com/jupyter/notebook
    cd notebook
    python setup.py js css
    pip install -e .
