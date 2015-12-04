
`View the original notebook on nbviewer <http://nbviewer.jupyter.org/github/jupyter/notebook/blob/master/docs/source/examples/Notebook/Working%20With%20Markdown%20Cells.ipynb>`__

Markdown Cells
==============

Text can be added to Jupyter Notebooks using Markdown cells. Markdown is
a popular markup language that is a superset of HTML. Its specification
can be found here:

http://daringfireball.net/projects/markdown/

Markdown basics
---------------

You can make text *italic* or **bold**.

You can build nested itemized or enumerated lists:

-  One

   -  Sublist

      -  This

-  Sublist - That - The other thing
-  Two
-  Sublist
-  Three
-  Sublist

Now another list:

1. Here we go

   1. Sublist
   2. Sublist

2. There we go
3. Now this

You can add horizontal rules:

--------------

Here is a blockquote:

    Beautiful is better than ugly. Explicit is better than implicit.
    Simple is better than complex. Complex is better than complicated.
    Flat is better than nested. Sparse is better than dense. Readability
    counts. Special cases aren't special enough to break the rules.
    Although practicality beats purity. Errors should never pass
    silently. Unless explicitly silenced. In the face of ambiguity,
    refuse the temptation to guess. There should be one-- and preferably
    only one --obvious way to do it. Although that way may not be
    obvious at first unless you're Dutch. Now is better than never.
    Although never is often better than *right* now. If the
    implementation is hard to explain, it's a bad idea. If the
    implementation is easy to explain, it may be a good idea. Namespaces
    are one honking great idea -- let's do more of those!

And shorthand for links:

`Jupyter's website <http://jupyter.org>`__

Headings
--------

You can add headings by starting a line with one (or multiple) ``#``
followed by a space, as in the following example:

Heading 1
=========

Heading 2
=========

Heading 2.1
-----------

Heading 2.2
-----------

Embedded code
-------------

You can embed code meant for illustration instead of execution in
Python:

::

    def f(x):
        """a docstring"""
        return x**2

or other languages:

::

    if (i=0; i<n; i++) {
      printf("hello %d\n", i);
      x += 4;
    }

LaTeX equations
---------------

Courtesy of MathJax, you can include mathematical expressions both
inline: :math:`e^{i\pi} + 1 = 0` and displayed:

.. math:: e^x=\sum_{i=0}^\infty \frac{1}{i!}x^i

Inline expressions can be added by surrounding the latex code with
``$``:

::

    $e^{i\pi} + 1 = 0$

Expressions on their own line are surrounded by ``$$``:

.. code:: latex

    $$e^x=\sum_{i=0}^\infty \frac{1}{i!}x^i$$

Github flavored markdown (GFM)
------------------------------

The Notebook webapp support Github flavored markdown meaning that you
can use triple backticks for code blocks

.. raw:: html

   <pre>
   ```python
   print "Hello World"
   ```

   ```javascript
   console.log("Hello World")
   ```
   </pre>

Gives

.. code:: python

    print "Hello World"

.. code:: javascript

    console.log("Hello World")

And a table like this :

.. raw:: html

   <pre>
   | This | is   |
   |------|------|
   |   a  | table| 
   </pre>

A nice Html Table

+--------+---------+
| This   | is      |
+========+=========+
| a      | table   |
+--------+---------+

General HTML
------------

Because Markdown is a superset of HTML you can even add things like HTML
tables:

.. raw:: html

   <table>

.. raw:: html

   <tr>

.. raw:: html

   <th>

Header 1

.. raw:: html

   </th>

.. raw:: html

   <th>

Header 2

.. raw:: html

   </th>

.. raw:: html

   </tr>

.. raw:: html

   <tr>

.. raw:: html

   <td>

row 1, cell 1

.. raw:: html

   </td>

.. raw:: html

   <td>

row 1, cell 2

.. raw:: html

   </td>

.. raw:: html

   </tr>

.. raw:: html

   <tr>

.. raw:: html

   <td>

row 2, cell 1

.. raw:: html

   </td>

.. raw:: html

   <td>

row 2, cell 2

.. raw:: html

   </td>

.. raw:: html

   </tr>

.. raw:: html

   </table>

Local files
-----------

If you have local files in your Notebook directory, you can refer to
these files in Markdown cells directly:

::

    [subdirectory/]<filename>

For example, in the images folder, we have the Python logo:

::

    <img src="../images/python_logo.svg" />

and a video with the HTML5 video tag:

::

    <video controls src="images/animation.m4v" />

.. raw:: html

   <video controls src="images/animation.m4v" />

These do not embed the data into the notebook file, and require that the
files exist when you are viewing the notebook.

Security of local files
~~~~~~~~~~~~~~~~~~~~~~~

Note that this means that the Jupyter notebook server also acts as a
generic file server for files inside the same tree as your notebooks.
Access is not granted outside the notebook folder so you have strict
control over what files are visible, but for this reason it is highly
recommended that you do not run the notebook server with a notebook
directory at a high level in your filesystem (e.g. your home directory).

When you run the notebook in a password-protected manner, local file
access is restricted to authenticated users unless read-only views are
active.

`View the original notebook on nbviewer <http://nbviewer.jupyter.org/github/jupyter/notebook/blob/master/docs/source/examples/Notebook/Working%20With%20Markdown%20Cells.ipynb>`__
