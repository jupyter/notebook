.. _working_remotely:

Running a notebook server
=========================


The :doc:`Jupyter notebook <notebook>` web application is based on a
server-client structure.  The notebook server uses a :ref:`two-process kernel
architecture <ipython:ipythonzmq>` based on ZeroMQ_, as well as Tornado_ for
serving HTTP requests.

.. note::
   By default, a notebook server runs locally at 127.0.0.1:8888
   and is accessible only from `localhost`. You may access the
   notebook server from the browser using `http://127.0.0.1:8888`.

This document describes how you can
:ref:`secure a notebook server <notebook_server_security>` and how to
:ref:`run it on a public interface <notebook_public_server>`.

.. important::

    **This is not the multi-user server you are looking for**. This document
    describes how you can run a public server with a single user. This should
    only be done by someone who wants remote access to their personal machine.
    Even so, doing this requires a thorough understanding of the set-ups
    limitations and security implications. If you allow multiple users to
    access a notebook server as it is described in this document, their
    commands may collide, clobber and overwrite each other.

    If you want a multi-user server, the official solution is  JupyterHub_.
    To use JupyterHub, you need a Unix server (typically Linux) running
    somewhere that is accessible to your users on a network. This may run over
    the public internet, but doing so introduces additional
    `security concerns <https://jupyterhub.readthedocs.io/en/latest/getting-started/security-basics.html>`_.



.. _ZeroMQ: http://zeromq.org

.. _Tornado: http://www.tornadoweb.org

.. _JupyterHub: https://jupyterhub.readthedocs.io/en/latest/

.. _notebook_server_security:

Securing a notebook server
--------------------------

You can protect your notebook server with a simple single password. As of notebook
5.0 this can be done automatically. To set up a password manually you can configure the
:attr:`NotebookApp.password` setting in :file:`jupyter_notebook_config.py`.


Prerequisite: A notebook configuration file
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Check to see if you have a notebook configuration file,
:file:`jupyter_notebook_config.py`. The default location for this file
is your Jupyter folder located in your home directory:

    - Windows: :file:`C:\\Users\\USERNAME\\.jupyter\\jupyter_notebook_config.py`
    - OS X: :file:`/Users/USERNAME/.jupyter/jupyter_notebook_config.py`
    - Linux: :file:`/home/USERNAME/.jupyter/jupyter_notebook_config.py`

If you don't already have a Jupyter folder, or if your Jupyter folder doesn't contain
a notebook configuration file, run the following command::

  $ jupyter notebook --generate-config

This command will create the Jupyter folder if necessary, and create notebook
configuration file, :file:`jupyter_notebook_config.py`, in this folder.


Automatic Password setup
~~~~~~~~~~~~~~~~~~~~~~~~

As of notebook 5.3, the first time you log-in using a token, the notebook server
should give you the opportunity to setup a password from the user interface.

You will be presented with a form asking for the current _token_, as well as
your _new_ _password_ ; enter both and click on ``Login and setup new password``.

Next time you need to log in you'll be able to use the new password instead of
the login token, otherwise follow the procedure to set a password from the
command line.

The ability to change the password at first login time may be disabled by
integrations by setting the ``--NotebookApp.allow_password_change=False``


Starting at notebook version 5.0, you can enter and store a password for your
notebook server with a single command. :command:`jupyter notebook password` will
prompt you for your password and record the hashed password in your
:file:`jupyter_notebook_config.json`.

.. code-block:: bash

    $ jupyter notebook password
    Enter password:  ****
    Verify password: ****
    [NotebookPasswordApp] Wrote hashed password to /Users/you/.jupyter/jupyter_notebook_config.json

This can be used to reset a lost password; or if you believe your credentials
have been leaked and desire to change your password. Changing your password will
invalidate all logged-in sessions after a server restart.

.. _hashed-pw:

Preparing a hashed password
~~~~~~~~~~~~~~~~~~~~~~~~~~~

You can prepare a hashed password manually, using the function
:func:`notebook.auth.security.passwd`:

.. code-block:: ipython

    In [1]: from notebook.auth import passwd
    In [2]: passwd()
    Enter password:
    Verify password:
    Out[2]: 'sha1:67c9e60bb8b6:9ffede0825894254b2e042ea597d771089e11aed'

.. caution::

  :func:`~notebook.auth.security.passwd` when called with no arguments
  will prompt you to enter and verify your password such as
  in the above code snippet. Although the function can also
  be passed a string as an argument such as ``passwd('mypassword')``, please
  **do not** pass a string as an argument inside an IPython session, as it
  will be saved in your input history.

Adding hashed password to your notebook configuration file
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
You can then add the hashed password to your
:file:`jupyter_notebook_config.py`. The default location for this file
:file:`jupyter_notebook_config.py` is in your Jupyter folder in your home
directory, ``~/.jupyter``, e.g.::

    c.NotebookApp.password = u'sha1:67c9e60bb8b6:9ffede0825894254b2e042ea597d771089e11aed'

Automatic password setup will store the hash in ``jupyter_notebook_config.json``
while this method stores the hash in ``jupyter_notebook_config.py``. The ``.json``
configuration options take precedence over the ``.py`` one, thus the manual
password may not take effect if the Json file has a password set.


Using SSL for encrypted communication
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
When using a password, it is a good idea to also use SSL with a web
certificate, so that your hashed password is not sent unencrypted by your
browser.

.. important::
   Web security is rapidly changing and evolving. We provide this document
   as a convenience to the user, and recommend that the user keep current on
   changes that may impact security, such as new releases of OpenSSL.
   The Open Web Application Security Project (`OWASP`_) website is a good resource
   on general security issues and web practices.

You can start the notebook to communicate via a secure protocol mode by setting
the ``certfile`` option to your self-signed certificate, i.e. ``mycert.pem``,
with the command::

    $ jupyter notebook --certfile=mycert.pem --keyfile mykey.key

.. tip::

    A self-signed certificate can be generated with ``openssl``.  For example,
    the following command will create a certificate valid for 365 days with
    both the key and certificate data written to the same file::

        $ openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout mykey.key -out mycert.pem

When starting the notebook server, your browser may warn that your self-signed
certificate is insecure or unrecognized.  If you wish to have a fully
compliant self-signed certificate that will not raise warnings, it is possible
(but rather involved) to create one, as explained in detail in this
`tutorial`_. Alternatively, you may use `Let's Encrypt`_ to acquire a free SSL
certificate and follow the steps in :ref:`using-lets-encrypt` to set up a
public server.

.. _OWASP: https://www.owasp.org
.. _tutorial: https://arstechnica.com/information-technology/2009/12/how-to-get-set-with-a-secure-sertificate-for-free/

.. _notebook_public_server:

Running a public notebook server
--------------------------------

If you want to access your notebook server remotely via a web browser,
you can do so by running a public notebook server. For optimal security
when running a public notebook server, you should first secure the
server with a password and SSL/HTTPS as described in
:ref:`notebook_server_security`.

Start by creating a certificate file and a hashed password, as explained in
:ref:`notebook_server_security`.

If you don't already have one, create a
config file for the notebook using the following command line::

  $ jupyter notebook --generate-config

In the ``~/.jupyter`` directory, edit the notebook config file,
``jupyter_notebook_config.py``.  By default, the notebook config file has
all fields commented out. The minimum set of configuration options that
you should uncomment and edit in :file:`jupyter_notebook_config.py` is the
following::

     # Set options for certfile, ip, password, and toggle off
     # browser auto-opening
     c.NotebookApp.certfile = u'/absolute/path/to/your/certificate/mycert.pem'
     c.NotebookApp.keyfile = u'/absolute/path/to/your/certificate/mykey.key'
     # Set ip to '*' to bind on all interfaces (ips) for the public server
     c.NotebookApp.ip = '*'
     c.NotebookApp.password = u'sha1:bcd259ccf...<your hashed password here>'
     c.NotebookApp.open_browser = False

     # It is a good idea to set a known, fixed port for server access
     c.NotebookApp.port = 9999

You can then start the notebook using the ``jupyter notebook`` command.

.. _using-lets-encrypt:

Using Let's Encrypt
~~~~~~~~~~~~~~~~~~~
`Let's Encrypt`_ provides free SSL/TLS certificates. You can also set up a
public server using a `Let's Encrypt`_ certificate.

:ref:`notebook_public_server` will be similar when using a Let's Encrypt
certificate with a few configuration changes. Here are the steps:

1. Create a `Let's Encrypt certificate <https://letsencrypt.org/getting-started/>`_.
2. Use :ref:`hashed-pw` to create one.
3. If you don't already have config file for the notebook, create one
   using the following command:

   .. code-block:: bash

       $ jupyter notebook --generate-config

4. In the ``~/.jupyter`` directory, edit the notebook config file,
``jupyter_notebook_config.py``.  By default, the notebook config file has
all fields commented out. The minimum set of configuration options that
you should to uncomment and edit in :file:`jupyter_notebook_config.py` is the
following::

     # Set options for certfile, ip, password, and toggle off
     # browser auto-opening
     c.NotebookApp.certfile = u'/absolute/path/to/your/certificate/fullchain.pem'
     c.NotebookApp.keyfile = u'/absolute/path/to/your/certificate/privkey.pem'
     # Set ip to '*' to bind on all interfaces (ips) for the public server
     c.NotebookApp.ip = '*'
     c.NotebookApp.password = u'sha1:bcd259ccf...<your hashed password here>'
     c.NotebookApp.open_browser = False

     # It is a good idea to set a known, fixed port for server access
     c.NotebookApp.port = 9999

You can then start the notebook using the ``jupyter notebook`` command.

.. important::

    **Use 'https'.**
    Keep in mind that when you enable SSL support, you must access the
    notebook server over ``https://``, not over plain ``http://``.  The startup
    message from the server prints a reminder in the console, but *it is easy
    to overlook this detail and think the server is for some reason
    non-responsive*.

    **When using SSL, always access the notebook server with 'https://'.**

You may now access the public server by pointing your browser to
``https://your.host.com:9999`` where ``your.host.com`` is your public server's
domain.

.. _`Let's Encrypt`: https://letsencrypt.org


Firewall Setup
~~~~~~~~~~~~~~

To function correctly, the firewall on the computer running the jupyter
notebook server must be configured to allow connections from client
machines on the access port ``c.NotebookApp.port`` set in
:file:`jupyter_notebook_config.py` to allow connections to the
web interface.  The firewall must also allow connections from
127.0.0.1 (localhost) on ports from 49152 to 65535.
These ports are used by the server to communicate with the notebook kernels.
The kernel communication ports are chosen randomly by ZeroMQ, and may require
multiple connections per kernel, so a large range of ports must be accessible.

Running the notebook with a customized URL prefix
-------------------------------------------------

The notebook dashboard, which is the landing page with an overview
of the notebooks in your working directory, is typically found and accessed
at the default URL ``http://localhost:8888/``.

If you prefer to customize the URL prefix for the notebook dashboard, you can
do so through modifying ``jupyter_notebook_config.py``. For example, if you
prefer that the notebook dashboard be located with a sub-directory that
contains other ipython files, e.g. ``http://localhost:8888/ipython/``,
you can do so with configuration options like the following (see above for
instructions about modifying ``jupyter_notebook_config.py``):

.. code-block:: python

    c.NotebookApp.base_url = '/ipython/'


Embedding the notebook in another website
-----------------------------------------

Sometimes you may want to embed the notebook somewhere on your website,
e.g. in an IFrame. To do this, you may need to override the
Content-Security-Policy to allow embedding. Assuming your website is at
`https://mywebsite.example.com`, you can embed the notebook on your website
with the following configuration setting in
:file:`jupyter_notebook_config.py`:

.. code-block:: python

    c.NotebookApp.tornado_settings = {
        'headers': {
            'Content-Security-Policy': "frame-ancestors https://mywebsite.example.com 'self' "
        }
    }

When embedding the notebook in a website using an iframe,
consider putting the notebook in single-tab mode.
Since the notebook opens some links in new tabs by default,
single-tab mode keeps the notebook from opening additional tabs.
Adding the following to :file:`~/.jupyter/custom/custom.js` will enable
single-tab mode:

.. code-block:: javascript

    define(['base/js/namespace'], function(Jupyter){
        Jupyter._target = '_self';
    });


Using a gateway server for kernel management
--------------------------------------------

You are now able to redirect the management of your kernels to a Gateway Server
(i.e., `Jupyter Kernel Gateway <https://jupyter-kernel-gateway.readthedocs.io/en/latest/>`_ or
`Jupyter Enterprise Gateway <https://jupyter-enterprise-gateway.readthedocs.io/en/latest/>`_)
simply by specifying a Gateway url via the following command-line option:

    .. code-block:: bash

        $ jupyter notebook --gateway-url=http://my-gateway-server:8888

the environment:

    .. code-block:: bash

        JUPYTER_GATEWAY_URL=http://my-gateway-server:8888

or in :file:`jupyter_notebook_config.py`:

   .. code-block:: python

      c.GatewayClient.url = http://my-gateway-server:8888

When provided, all kernel specifications will be retrieved from the specified Gateway server and all
kernels will be managed by that server.  This option enables the ability to target kernel processes
against managed clusters while allowing for the notebook's management to remain local to the Notebook
server.

Known issues
------------

Proxies
~~~~~~~

When behind a proxy, especially if your system or browser is set to autodetect
the proxy, the notebook web application might fail to connect to the server's
websockets, and present you with a warning at startup. In this case, you need
to configure your system not to use the proxy for the server's address.

For example, in Firefox, go to the Preferences panel, Advanced section,
Network tab, click 'Settings...', and add the address of the notebook server
to the 'No proxy for' field.

Content-Security-Policy (CSP)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Certain `security guidelines
<https://infosec.mozilla.org/guidelines/web_security.html#content-security-policy>`_
recommend that servers use a Content-Security-Policy (CSP) header to prevent
cross-site scripting vulnerabilities, specifically limiting to ``default-src:
https:`` when possible.  This directive causes two problems with Jupyter.
First, it disables execution of inline javascript code, which is used
extensively by Jupyter.  Second, it limits communication to the https scheme,
and prevents WebSockets from working because they communicate via the wss
scheme (or ws for insecure communication).  Jupyter uses WebSockets for
interacting with kernels, so when you visit a server with such a CSP, your
browser will block attempts to use wss, which will cause you to see
"Connection failed" messages from jupyter notebooks, or simply no response
from jupyter terminals.  By looking in your browser's javascript console, you
can see any error messages that will explain what is failing.

To avoid these problem, you need to add ``'unsafe-inline'`` and ``connect-src
https: wss:`` to your CSP header, at least for pages served by jupyter.  (That
is, you can leave your CSP unchanged for other parts of your website.)  Note
that multiple CSP headers are allowed, but successive CSP headers can only
restrict the policy; they cannot loosen it.  For example, if your server sends
both of these headers

    Content-Security-Policy "default-src https: 'unsafe-inline'"
    Content-Security-Policy "connect-src https: wss:"

the first policy will already eliminate wss connections, so the second has no
effect.  Therefore, you can't simply add the second header; you have to
actually modify your CSP header to look more like this:

    Content-Security-Policy "default-src https: 'unsafe-inline'; connect-src https: wss:"



Docker CMD
~~~~~~~~~~

Using ``jupyter notebook`` as a
`Docker CMD <https://docs.docker.com/engine/reference/builder/#cmd>`_ results in
kernels repeatedly crashing, likely due to a lack of `PID reaping
<https://blog.phusion.nl/2015/01/20/docker-and-the-pid-1-zombie-reaping-problem/>`_.
To avoid this, use the `tini <https://github.com/krallin/tini>`_ ``init`` as your
Dockerfile `ENTRYPOINT`::

  # Add Tini. Tini operates as a process subreaper for jupyter. This prevents
  # kernel crashes.
  ENV TINI_VERSION v0.6.0
  ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /usr/bin/tini
  RUN chmod +x /usr/bin/tini
  ENTRYPOINT ["/usr/bin/tini", "--"]

  EXPOSE 8888
  CMD ["jupyter", "notebook", "--port=8888", "--no-browser", "--ip=0.0.0.0"]
