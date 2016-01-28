
`View the original notebook on nbviewer <http://nbviewer.jupyter.org/github/jupyter/notebook/blob/master/docs/source/examples/Notebook/Typesetting%20Equations.ipynb>`__

The Markdown parser included in the Jupyter Notebook is MathJax-aware.
This means that you can freely mix in mathematical expressions using the
`MathJax subset of Tex and
LaTeX <http://docs.mathjax.org/en/latest/tex.html#tex-support>`__. `Some
examples from the MathJax
site <http://www.mathjax.org/demos/tex-samples/>`__ are reproduced
below, as well as the Markdown+TeX source.

Motivating Examples
===================

The Lorenz Equations
--------------------

Source
~~~~~~

::

    \begin{align}
    \dot{x} & = \sigma(y-x) \\
    \dot{y} & = \rho x - y - xz \\
    \dot{z} & = -\beta z + xy
    \end{align}

Display
~~~~~~~

.. raw:: latex

   \begin{align}
   \dot{x} & = \sigma(y-x) \\
   \dot{y} & = \rho x - y - xz \\
   \dot{z} & = -\beta z + xy
   \end{align}

The Cauchy-Schwarz Inequality
-----------------------------

Source
~~~~~~

::

    \begin{equation*}
    \left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)
    \end{equation*}

Display
~~~~~~~

.. raw:: latex

   \begin{equation*}
   \left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)
   \end{equation*}

A Cross Product Formula
-----------------------

Source
~~~~~~

::

    \begin{equation*}
    \mathbf{V}_1 \times \mathbf{V}_2 =  \begin{vmatrix}
    \mathbf{i} & \mathbf{j} & \mathbf{k} \\
    \frac{\partial X}{\partial u} &  \frac{\partial Y}{\partial u} & 0 \\
    \frac{\partial X}{\partial v} &  \frac{\partial Y}{\partial v} & 0
    \end{vmatrix}  
    \end{equation*}

Display
~~~~~~~

.. raw:: latex

   \begin{equation*}
   \mathbf{V}_1 \times \mathbf{V}_2 =  \begin{vmatrix}
   \mathbf{i} & \mathbf{j} & \mathbf{k} \\
   \frac{\partial X}{\partial u} &  \frac{\partial Y}{\partial u} & 0 \\
   \frac{\partial X}{\partial v} &  \frac{\partial Y}{\partial v} & 0
   \end{vmatrix}  
   \end{equation*}

The probability of getting (k) heads when flipping (n) coins is
---------------------------------------------------------------

Source
~~~~~~

::

    \begin{equation*}
    P(E)   = {n \choose k} p^k (1-p)^{ n-k} 
    \end{equation*}

Display
~~~~~~~

.. raw:: latex

   \begin{equation*}
   P(E)   = {n \choose k} p^k (1-p)^{ n-k} 
   \end{equation*}

An Identity of Ramanujan
------------------------

Source
~~~~~~

::

    \begin{equation*}
    \frac{1}{\Bigl(\sqrt{\phi \sqrt{5}}-\phi\Bigr) e^{\frac25 \pi}} =
    1+\frac{e^{-2\pi}} {1+\frac{e^{-4\pi}} {1+\frac{e^{-6\pi}}
    {1+\frac{e^{-8\pi}} {1+\ldots} } } } 
    \end{equation*}

Display
~~~~~~~

.. raw:: latex

   \begin{equation*}
   \frac{1}{\Bigl(\sqrt{\phi \sqrt{5}}-\phi\Bigr) e^{\frac25 \pi}} =
   1+\frac{e^{-2\pi}} {1+\frac{e^{-4\pi}} {1+\frac{e^{-6\pi}}
   {1+\frac{e^{-8\pi}} {1+\ldots} } } } 
   \end{equation*}

A Rogers-Ramanujan Identity
---------------------------

Source
~~~~~~

::

    \begin{equation*}
    1 +  \frac{q^2}{(1-q)}+\frac{q^6}{(1-q)(1-q^2)}+\cdots =
    \prod_{j=0}^{\infty}\frac{1}{(1-q^{5j+2})(1-q^{5j+3})},
    \quad\quad \text{for $|q|<1$}. 
    \end{equation*}

Display
~~~~~~~

.. raw:: latex

   \begin{equation*}
   1 + \frac{q^2}{(1-q)}+\frac{q^6}{(1-q)(1-q^2)}+\cdots =
   \prod_{j=0}^{\infty}\frac{1}{(1-q^{5j+2})(1-q^{5j+3})},
   \quad\quad \text{for $|q|<1$}. 
   \end{equation*}

Maxwell's Equations
-------------------

Source
~~~~~~

::

    \begin{align}
    \nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} & = \frac{4\pi}{c}\vec{\mathbf{j}} \\   \nabla \cdot \vec{\mathbf{E}} & = 4 \pi \rho \\
    \nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} & = \vec{\mathbf{0}} \\
    \nabla \cdot \vec{\mathbf{B}} & = 0 
    \end{align}

Display
~~~~~~~

.. raw:: latex

   \begin{align}
   \nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} & = \frac{4\pi}{c}\vec{\mathbf{j}} \\   \nabla \cdot \vec{\mathbf{E}} & = 4 \pi \rho \\
   \nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} & = \vec{\mathbf{0}} \\
   \nabla \cdot \vec{\mathbf{B}} & = 0 
   \end{align}

Equation Numbering and References
=================================

Equation numbering and referencing will be available in a future version
of the Jupyter notebook.

Inline Typesetting (Mixing Markdown and TeX)
--------------------------------------------

While display equations look good for a page of samples, the ability to
mix math and *formatted* **text** in a paragraph is also important.

Source
~~~~~~

::

    This expression $\sqrt{3x-1}+(1+x)^2$ is an example of a TeX inline equation in a [Markdown-formatted](http://daringfireball.net/projects/markdown/) sentence.  

Display
~~~~~~~

This expression :math:`\sqrt{3x-1}+(1+x)^2` is an example of a TeX
inline equation in a
`Markdown-formatted <http://daringfireball.net/projects/markdown/>`__
sentence.

Other Syntax
============

You will notice in other places on the web that ``$$`` are needed
explicitly to begin and end MathJax typesetting. This is **not**
required if you will be using TeX environments, but the Jupyter notebook
will accept this syntax on legacy notebooks.

Source
------

::

    $$
    \begin{array}{c}
    y_1 \\\
    y_2 \mathtt{t}_i \\\
    z_{3,4}
    \end{array}
    $$

::

    $$
    \begin{array}{c}
    y_1 \cr
    y_2 \mathtt{t}_i \cr
    y_{3}
    \end{array}
    $$

::

    $$\begin{eqnarray} 
    x' &=& &x \sin\phi &+& z \cos\phi \\
    z' &=& - &x \cos\phi &+& z \sin\phi \\
    \end{eqnarray}$$

::

    $$
    x=4
    $$

Display
-------

.. math::


   \begin{array}{c}
   y_1 \\\
   y_2 \mathtt{t}_i \\\
   z_{3,4}
   \end{array}

.. math::


   \begin{array}{c}
   y_1 \cr
   y_2 \mathtt{t}_i \cr
   y_{3}
   \end{array}

.. math::

   \begin{eqnarray} 
   x' &=& &x \sin\phi &+& z \cos\phi \\
   z' &=& - &x \cos\phi &+& z \sin\phi \\
   \end{eqnarray}

.. math::


   x=4

`View the original notebook on nbviewer <http://nbviewer.jupyter.org/github/jupyter/notebook/blob/master/docs/source/examples/Notebook/Typesetting%20Equations.ipynb>`__
