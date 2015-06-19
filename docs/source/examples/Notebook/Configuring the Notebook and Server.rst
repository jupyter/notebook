
`View the original notebook on nbviewer <http://nbviewer.jupyter.org/github/jupyter/notebook/blob/master/docs/source/examples/Notebook/Configuring%20the%20Notebook%20and%20Server.ipynb>`__

Configuring the Notebook and Server
===================================

Configuring the Jupyter Notebook
--------------------------------

The notebook web server can also be configured using Jupyter profiles
and configuration files. The Notebook web server configuration options
are set in a file named ``jupyter_notebook_config.py`` in your Jupyter
directory, which itself is usually ``.jupyter`` in your home directory.

The default version of ``jupyter_notebook_config.py`` lists all of the
options available along with documentation for each. Changes made to
that file will affect all notebook servers run under that profile.
Command line options always override those set in configuration files.

You can create a new config:

.. code:: python

    !jupyter notebook --generate-config

More details about Jupyter configuration files and profiles can be found
`here <http://ipython.org/ipython-doc/dev/config/intro.html>`__.

Securing the notebook server
----------------------------

The Jupyter Notebook allows arbitrary code execution on the computer
running it. Thus, the notebook web server should never be run on the
open internet without first securing it. By default, the notebook server
only listens on local network interface (``127.0.0.1``) There are two
steps required to secure the notebook server:

1. Setting a password
2. Encrypt network traffic using SSL

Setting a password
~~~~~~~~~~~~~~~~~~

You can protect your notebook server with a simple single password by
setting the ``NotebookApp.password`` configurable. You can prepare a
hashed password using the function ``IPython.lib.passwd``:

.. code:: python

    from IPython.lib import passwd
    password = passwd("secret")
    password

You can then add this to your ``jupyter_notebook_config.py``:

.. code:: python

    # Password to use for web authentication
    c = get_config()
    c.NotebookApp.password = 
    u'sha1:6c2164fc2b22:ed55ecf07fc0f985ab46561483c0e888e8964ae6'

Using SSL/HTTPS
~~~~~~~~~~~~~~~

When using a password, it is a good idea to also use SSL, so that your
password is not sent unencrypted by your browser to the web server. When
running the notebook on the public internet this is absolutely required.

The first step is to generate an SSL certificate. A self-signed
certificate can be generated with ``openssl``. For example, the
following command will create a certificate valid for 365 days with both
the key and certificate data written to the same file:

::

    openssl req -x509 -nodes -days 365 -newkey rsa:1024 -keyout mycert.pem -out mycert.pem

In most cases, you should run this command in your profile directory,
which will make it easy to use the generated key and certificate.

When you connect to a notebook server over HTTPS using a self-signed
certificate, your browser will warn you of a dangerous certificate
because it is self-signed. If you want to have a fully compliant
certificate that will not raise warnings, it is possible (but rather
involved) to obtain one, as explained in detail in `this
tutorial <http://arstechnica.com/security/news/2009/12/how-to-get-set-with-a-secure-sertificate-for-free.ars>`__

When you enable SSL support, you will need to access the notebook server
over ``https://``, rather than plain ``http://``. The startup message
from the notebook server prints the correct URL, but it is easy to
overlook and think the server is for some reason non-responsive.

Once you have generated the key and certificate, you can configure the
notebook server to use them, by adding the following to
``jupyter_notebook_config.py``:

.. code:: python

    # The full path to an SSL/TLS certificate file.
    c.NotebookApp.certfile = u'/Users/bgranger/.jupyter/mycert.crt'

    # The full path to a private key file for usage with SSL/TLS.
    c.NotebookApp.keyfile = u'/Users/bgranger/.jupyter/mycert.key'

Running a public notebook server
--------------------------------

.. raw:: html

   <div class="alert alert-error">

Don't run a public notebook server unless you first secure it with a
password and SSL/HTTPS as described above

.. raw:: html

   </div>

By default the notebook server only listens on the
``localhost/127.0.0.1`` network interface. If you want to connect to the
notebook from another computers, or over the internet, you need to
configure the notebook server to listen on all network interfaces and
not open the browser. You will often also want to disable the automatic
launching of the web browser.

This can be accomplished by passing a command line options.

::

    jupyter notebook --ip=* --no-browser

You can also add the following to your ``jupyter_notebook_config.py``
file:

.. code:: python

    c.NotebookApp.ip = '*'
    c.NotebookApp.open_browser = False

Running with a different URL prefix
-----------------------------------

The notebook dashboard typically lives at the URL
``http://localhost:8888/tree``. If you prefer that it lives, together
with the rest of the notebook web application, under a base URL prefix,
such as ``http://localhost:8888/ipython/tree``, you can do so by adding
the following lines to your ``jupyter_notebook_config.py`` file.

.. code:: python

    c.NotebookApp.base_url = '/ipython/'
    c.NotebookApp.webapp_settings = {'static_url_prefix':'/ipython/static/'}

Using a different notebook store
--------------------------------

By default, the notebook server stores the notebook documents that it
saves as files in the working directory of the notebook server, also
known as the ``notebook_dir``. This logic is implemented in the
``FileNotebookManager`` class. However, the server can be configured to
use a different notebook manager class, which can store the notebooks in
a different format.

The `bookstore <https://github.com/rgbkrk/bookstore>`__ package
currently allows users to store notebooks on Rackspace CloudFiles or
OpenStack Swift based object stores.

Writing a notebook manager is as simple as extending the base class
``NotebookManager``. The
`simple\_notebook\_manager <https://github.com/khinsen/simple_notebook_manager>`__
provides a great example of an in memory notebook manager, created
solely for the purpose of illustrating the notebook manager API.

Known issues
------------

When behind a proxy, especially if your system or browser is set to
autodetect the proxy, the notebook web application might fail to connect
to the server's websockets, and present you with a warning at startup.
In this case, you need to configure your system not to use the proxy for
the server's address.

For example, in Firefox, go to the Preferences panel, Advanced section,
Network tab, click 'Settings...', and add the address of the notebook
server to the 'No proxy for' field.

`View the original notebook on nbviewer <http://nbviewer.jupyter.org/github/jupyter/notebook/blob/master/docs/source/examples/Notebook/Configuring%20the%20Notebook%20and%20Server.ipynb>`__
