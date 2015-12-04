
`View the original notebook on nbviewer <http://nbviewer.jupyter.org/github/jupyter/notebook/blob/master/docs/source/examples/Notebook/Running%20Code.ipynb>`__

Running Code
============

First and foremost, the Jupyter Notebook is an interactive environment
for writing and running code. The notebook is capable of running code in
a wide range of languages. However, each notebook is associated with a
single kernel. This notebook is associated with the IPython kernel,
therefor runs Python code.

Code cells allow you to enter and run code
------------------------------------------

Run a code cell using ``Shift-Enter`` or pressing the

.. raw:: html

   <button class="btn btn-default btn-xs">

.. raw:: html

   </button>

button in the toolbar above:

.. code:: python

    a = 10

.. code:: python

    print(a)

There are two other keyboard shortcuts for running code:

-  ``Alt-Enter`` runs the current cell and inserts a new one below.
-  ``Ctrl-Enter`` run the current cell and enters command mode.

Managing the Kernel
-------------------

Code is run in a separate process called the Kernel. The Kernel can be
interrupted or restarted. Try running the following cell and then hit
the

.. raw:: html

   <button class="btn btn-default btn-xs">

.. raw:: html

   </button>

button in the toolbar above.

.. code:: python

    import time
    time.sleep(10)

If the Kernel dies you will be prompted to restart it. Here we call the
low-level system libc.time routine with the wrong argument via ctypes to
segfault the Python interpreter:

.. code:: python

    import sys
    from ctypes import CDLL
    # This will crash a Linux or Mac system
    # equivalent calls can be made on Windows
    dll = 'dylib' if sys.platform == 'darwin' else 'so.6'
    libc = CDLL("libc.%s" % dll) 
    libc.time(-1)  # BOOM!!

Cell menu
---------

The "Cell" menu has a number of menu items for running code in different
ways. These includes:

-  Run and Select Below
-  Run and Insert Below
-  Run All
-  Run All Above
-  Run All Below

Restarting the kernels
----------------------

The kernel maintains the state of a notebook's computations. You can
reset this state by restarting the kernel. This is done by clicking on
the

.. raw:: html

   <button class="btn btn-default btn-xs">

.. raw:: html

   </button>

in the toolbar above.

sys.stdout and sys.stderr
-------------------------

The stdout and stderr streams are displayed as text in the output area.

.. code:: python

    print("hi, stdout")

.. code:: python

    from __future__ import print_function
    print('hi, stderr', file=sys.stderr)

Output is asynchronous
----------------------

All output is displayed asynchronously as it is generated in the Kernel.
If you execute the next cell, you will see the output one piece at a
time, not all at the end.

.. code:: python

    import time, sys
    for i in range(8):
        print(i)
        time.sleep(0.5)

Large outputs
-------------

To better handle large outputs, the output area can be collapsed. Run
the following cell and then single- or double- click on the active area
to the left of the output:

.. code:: python

    for i in range(50):
        print(i)

Beyond a certain point, output will scroll automatically:

.. code:: python

    for i in range(500):
        print(2**i - 1)


`View the original notebook on nbviewer <http://nbviewer.jupyter.org/github/jupyter/notebook/blob/master/docs/source/examples/Notebook/Running%20Code.ipynb>`__
