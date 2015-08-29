
`View the original notebook on nbviewer <http://nbviewer.jupyter.org/github/jupyter/notebook/blob/master/docs/source/examples/Notebook/JavaScript%20Notebook%20Extensions.ipynb>`__

Embracing web standards
=======================

<<<<<<< HEAD
One of the main reason that allowed us to develop the current notebook
web application was to embrace the web technology.

By being a pure web application using HTML, Javascript and CSS, the
=======
One of the main reasons why we developed the current notebook
web application was to embrace the web technology.

By being a pure web application using HTML,Javascript,and CSS, the
>>>>>>> de44f5b... Update JavaScript Notebook Extensions.rst
Notebook can get all the web technology improvement for free. Thus, as
browser support for different media extend, the notebook web app should
be able to be compatible without modification.

This is also true with performance of the User Interface as the speed of
JavaScript VM increases.

The other advantage of using only web technology is that the code of the
interface is fully accessible to the end user and is modifiable live. Even
if this task is not always easy, we strive to keep our code as
accessible and reusable as possible. This should allow us with minimum
effort to develop small extensions that customize the behavior of the
web interface.

Tampering with Notebook app
---------------------------

<<<<<<< HEAD
The first tool that is available to you and that you should be aware of
are browser "developers tool". The exact naming can change across
browser, and might require the installation of extensions. But basically
they can allow you to inspect/modify the DOM, and interact with the
javascript code that run the frontend.

-  In Chrome and safari Developer tools are in the menu [Put menu name
   in english here]
-  In firefox you might need to install
=======
The first tool that is availlable to you and that you should be aware of
are browser "developers tool". The exact naming can change across
browser and might require the installation of extensions. But basically
they allow you to inspect/modify the DOM, and interact with the
javascript code that runs the frontend.

-  In Chrome and Safari, developer tools are in the menu [Put menu name
   in English here]
-  In Firefox you might need to install
>>>>>>> de44f5b... Update JavaScript Notebook Extensions.rst
   `Firebug <http://getfirebug.com/>`__
-  Others ?

Those will be your best friends to debug and try different approaches for
your extensions.

Injecting JS
~~~~~~~~~~~~

Using magics
^^^^^^^^^^^^

<<<<<<< HEAD
Above tools can be tedious to edit long javascript files. Hopefully we
provide the ``%%javascript`` magic. This allows you to quickly inject
javascript into the notebook. Still the javascript injected this way
will not survive reloading. Hence it is a good tool for testing an
=======
The above tools can be tedious for editing long JavaScript files. Therefore, we
provide the ``%%javascript`` magic. This allows you to quickly inject
JavaScript into the notebook. Still the JavaScript injected this way
will not survive reloading. Hence, it is a good tool for testing an
>>>>>>> de44f5b... Update JavaScript Notebook Extensions.rst
refining a script.

You might see here and there people modifying css and injecting js into the
notebook by reading file(s) and publishing them into the notebook. Not only does
this often break the flow of the notebook and make the re-execution of
the notebook broken, but it also means that you need to execute those
cells in the entire notebook every time you need to update the code.

This can still be useful in some cases, like the ``%autosave`` magic
that allows to control the time between each save. But this can be
replaced by a JavaScript dropdown menu to select the save interval.

.. code:: python

    ## you can inspect the autosave code to see what it does.
    %autosave??

custom.js
^^^^^^^^^

To inject Javascript we provide an entry point: ``custom.js`` that allows
the user to execute and load other resources into the notebook.
Javascript code in ``custom.js`` will be executed when the notebook app
<<<<<<< HEAD
start and can then be used to customize almost anything in the UI and in
=======
starts and can then be used to customise almost anything in the UI and in
>>>>>>> de44f5b... Update JavaScript Notebook Extensions.rst
the behavior of the notebook.

``custom.js`` can be found in the Jupyter dir. You can share your
custom.js with others.

Back to theory
''''''''''''''

.. code:: python

    import os.path
    profile_dir = '~/.jupyter'
    profile_dir = os.path.expanduser(profile_dir)
    profile_dir

and custom js is in

.. code:: python

    import os.path
    custom_js_path = os.path.join(profile_dir,'custom','custom.js')

.. code:: python

    #  my custom js
    if os.path.isfile(custom_js_path):
        with open(custom_js_path) as f:
            for l in f: 
                print(l)
    else:
        print("You don't have a custom.js file")  

Note that ``custom.js`` is meant to be modified by user. When writing a
script, you can define it in a separate file and add a line of
configuration into ``custom.js`` that will fetch and execute the file.

**Warning** : even if modification of ``custom.js`` takes effect
immediately after browser refresh (except if browser cache is
aggressive), *creating* a file in ``static/`` directory needs a **server
restart**.

Exercise :
----------

-  Create a ``custom.js`` in the right location with the following
   content:

   .. code:: javascript

       alert("hello world from custom.js")

-  Restart your server and open any notebook.
-  Be greeted by custom.js

Have a look at `default
custom.js <https://github.com/ipython/ipython/blob/3.x/IPython/html/static/custom/custom.js>`__,
to see it's content and some more explanation.

For the quick ones :
^^^^^^^^^^^^^^^^^^^^

We've seen above that you can change the autosave rate by using a magic.
This is typically something I don't want to type everytime, and that I
<<<<<<< HEAD
don't like to embed into my workflow and documents. (reader don't care
what my autosave time is), let's build an extension that allow to do it.

Create a dropdown element in the toolbar (DOM
=======
don't like to embed into my workwlow and documents (readers don't care
what my autosave time is). Let's build an extension that allows us to do it.

Create a dropdown elemment in the toolbar (DOM
>>>>>>> de44f5b... Update JavaScript Notebook Extensions.rst
``Jupyter.toolbar.element``), you will need

-  ``IPython.notebook.set_autosave_interval(miliseconds)``
-  know that 1min = 60 sec, and 1 sec = 1000 ms

.. code:: javascript


    var label = jQuery('<label/>').text('AutoScroll Limit:');
    var select = jQuery('<select/>')
         //.append(jQuery('<option/>').attr('value', '2').text('2min (default)'))
         .append(jQuery('<option/>').attr('value', undefined).text('disabled'))

         // TODO:
         //the_toolbar_element.append(label)
         //the_toolbar_element.append(select);
         
    select.change(function() {
         var val = jQuery(this).val() // val will be the value in [2]
         // TODO
         // this will be called when dropdown changes

    });

    var time_m = [1,5,10,15,30];
    for (var i=0; i < time_m.length; i++) {
         var ts = time_m[i];
                                              //[2]   ____ this will be `val` on [1]  
                                              //     | 
                                              //     v 
         select.append($('<option/>').attr('value', ts).text(thr+'min'));
         // this will fill up the dropdown `select` with
         // 1 min
         // 5 min
         // 10 min
         // 10 min
         // ...
    }

A non interactive example first
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

I like my cython to be nicely highlighted

.. code:: javascript

    IPython.config.cell_magic_highlight['magic_text/x-cython'] = {}
    IPython.config.cell_magic_highlight['magic_text/x-cython'].reg = [/^%%cython/]

``text/x-cython`` is the name of CodeMirror mode name, ``magic_`` prefix
will just patch the mode so that the first line that contains a magic
does not screw up the highlighting. ``reg``\ is a list or regular
expression that will trigger the change of mode.

Get more docs
^^^^^^^^^^^^^

Sadly you will have to read the js source file (but there are lots of
comments) and/or build the JavaScript documentation using yuidoc. If you
have ``node`` and ``yui-doc`` installed:

.. code:: bash

    $ cd ~/jupyter/notebook/notebook/static/notebook/js/
    $ yuidoc . --server
    warn: (yuidoc): Failed to extract port, setting to the default :3000
    info: (yuidoc): Starting YUIDoc@0.3.45 using YUI@3.9.1 with NodeJS@0.10.15
    info: (yuidoc): Scanning for yuidoc.json file.
    info: (yuidoc): Starting YUIDoc with the following options:
    info: (yuidoc):
    { port: 3000,
      nocode: false,
      paths: [ '.' ],
      server: true,
      outdir: './out' }
    info: (yuidoc): Scanning for yuidoc.json file.
    info: (server): Starting server: http://127.0.0.1:3000

and browse http://127.0.0.1:3000 to get docs

Some convenience methods
^^^^^^^^^^^^^^^^^^^^^^^^

<<<<<<< HEAD
By browsing the doc you will see that we have some convenience methods
that avoid to re-invent the UI everytime :
=======
By browsing the docs, you will see that we have some convenience methods
that allow us to avoid re-inventing the UI everytime :
>>>>>>> de44f5b... Update JavaScript Notebook Extensions.rst

.. code:: javascript

    Jupyter.toolbar.add_buttons_group([
            {
                 'label'   : 'run qtconsole',
                 'icon'    : 'icon-terminal', // select your icon from 
                                              // http://fortawesome.github.io/Font-Awesome/icons/
                 'callback': function(){IPython.notebook.kernel.execute('%qtconsole')}
            }
            // add more button here if needed.
            ]);

with a `lot of
icons <http://fortawesome.github.io/Font-Awesome/icons/>`__ you can
select from.

Cell Metadata
-------------

<<<<<<< HEAD
The most requested feature is generally to be able to distinguish
individual cell in the notebook, or run specific action with them. To do
so, you can either use ``Jupyter.notebook.get_selected_cell()``, or rely
on ``CellToolbar``. This allow you to register asset of action and
graphical element that will be attached on individual cells.
=======
The most requested feature is generaly to be able to distinguish an
individual cell in the notebook, or run a specific action with them. To do
so, you can either use ``Jupyter.notebook.get_selected_cell()``, or rely
on ``CellToolbar``. This allows you to register a set of actions and
graphical elements that will be attached to individual cells.
>>>>>>> de44f5b... Update JavaScript Notebook Extensions.rst

Cell Toolbar
~~~~~~~~~~~~

You can see some examples of what can be done by toggling the
``Cell Toolbar`` selector in the toolbar on top of the notebook. It
provides two default ``presets`` that are ``Default`` and ``slideshow``.
Default allows editing the metadata attached to each cell manually.

<<<<<<< HEAD
First we define a function that takes at first parameter an element on
the DOM in which to inject UI element. Second element will be the cell
this element will be registered with. Then we will need to register that
function ad give it a name.
=======
First we define a function that takes as a first parameter an element on
the DOM in which to inject UI element. The second element will be the cell
this element will be registerd with. Then, we will need to register that
function and give it a name.
>>>>>>> de44f5b... Update JavaScript Notebook Extensions.rst

Register a callback
^^^^^^^^^^^^^^^^^^^

.. code:: python

    %%javascript
    var CellToolbar = Jupyter.CellToolbar
    var toggle =  function(div, cell) {
         var button_container = $(div)
    
         // let's create a button that show the  current value of the metadata
         var button = $('<button/>').addClass('btn btn-mini').text(String(cell.metadata.foo));
    
         // On click, change the metadata value and update the button label
         button.click(function(){
                     var v = cell.metadata.foo;
                     cell.metadata.foo = !v;
                     button.text(String(!v));
                 })
    
         // add the button to the DOM div.
         button_container.append(button);
    }
    
     // now we register the callback under the name foo to give the
     // user the ability to use it later
     CellToolbar.register_callback('tuto.foo', toggle);

Registering a preset
^^^^^^^^^^^^^^^^^^^^

This function can now be part of many ``preset`` of the CellToolBar.

.. code:: python

    %%javascript
    Jupyter.CellToolbar.register_preset('Tutorial 1',['tuto.foo','default.rawedit'])
    Jupyter.CellToolbar.register_preset('Tutorial 2',['slideshow.select','tuto.foo'])

You should now have access to two presets :

-  Tutorial 1
-  Tutorial 2

And check that the buttons you define share state when you toggle preset.
Check moreover that the metadata of the cell is modified when you click
the button, and that when saved or reloaded the metadata is still
availlable.

Exercise:
^^^^^^^^^

Try to wrap the all code in a file, put this file in
``{profile}/static/custom/<a-name>.js``, and add

::

    require(['custom/<a-name>']);

in ``custom.js`` to have this script automatically load in all your
notebooks.

``require`` is provided by a `javascript
<<<<<<< HEAD
library <http://requirejs.org/>`__ that allow to express dependency. For
simple extension like the previous one we directly mute the global
namespace, but for more complex extension you could pass a callback to
=======
library <http://requirejs.org/>`__ that allows expressing dependency. For a
simple extension like the previous one, we directly mute the global
namespace. For more complex extensions, you could pass a callback to
>>>>>>> de44f5b... Update JavaScript Notebook Extensions.rst
``require([...], <callback>)`` call, to allow the user to pass
configuration information to your plugin.

In Python lang,

.. code:: javascript

    require(['a/b', 'c/d'], function( e, f){
        e.something()
        f.something()
    })

could be read as

.. code:: python

    import a.b as e
    import c.d as f
    e.something()
    f.something()

See for example @damianavila ["ZenMode"
plugin](https://github.com/ipython-contrib/IPython-notebook-extensions/blob/master/custom.example.js#L34)
:

.. code:: javascript


    // read that as
    // import custom.zenmode.main as zenmode
    require(['custom/zenmode/main'],function(zenmode){
        zenmode.background('images/back12.jpg');
    })

For the quickest
^^^^^^^^^^^^^^^^

Try to use `the
following <https://github.com/ipython/ipython/blob/1.x/IPython/html/static/notebook/js/celltoolbar.js#L367>`__
to bind a dropdown list to ``cell.metadata.difficulty.select``.

It should be able to take the 4 following values :

-  ``<None>``
-  ``Easy``
-  ``Medium``
-  ``Hard``

<<<<<<< HEAD
We will use it to customize the output of the converted notebook
depending of the tag on each cell
=======
We will use it to customise the output of the converted notebook
depending on the tag on each cell
>>>>>>> de44f5b... Update JavaScript Notebook Extensions.rst

.. code:: python

    %load soln/celldiff.js

`View the original notebook on nbviewer <http://nbviewer.jupyter.org/github/jupyter/notebook/blob/master/docs/source/examples/Notebook/JavaScript%20Notebook%20Extensions.ipynb>`__
