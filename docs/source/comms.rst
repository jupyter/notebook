Comms
=====

*Comms* allow custom messages between the frontend and the kernel. They are used,
for instance, in `ipywidgets <http://ipywidgets.readthedocs.io/en/latest/>`__ to
update widget state.

A comm consists of a pair of objects, in the kernel and the frontend, with an
automatically assigned unique ID. When one side sends a message, a callback on
the other side is triggered with that message data. Either side, the frontend
or kernel, can open or close the comm.

.. seealso::

    `Custom Messages <http://jupyter-client.readthedocs.io/en/latest/messaging.html#custom-messages>`__
      The messaging specification section on comms

Opening a comm from the kernel
------------------------------

First, the function to accept the comm must be available on the frontend. This
can either be specified in a `requirejs` module, or registered in a registry, for
example when an :doc:`extension <extending/frontend_extensions>` is loaded.
This example shows a frontend comm target registered in a registry:

.. code-block:: javascript

    Jupyter.notebook.kernel.comm_manager.register_target('my_comm_target',
        function(comm, msg) {
            // comm is the frontend comm instance
            // msg is the comm_open message, which can carry data

            // Register handlers for later messages:
            comm.on_msg(function(msg) {...});
            comm.on_close(function(msg) {...});
            comm.send({'foo': 0});
        });

Now that the frontend comm is registered, you can open the comm from the kernel:

.. code-block:: python

    from ipykernel.comm import Comm

    # Use comm to send a message from the kernel
    my_comm = Comm(target_name='my_comm_target', data={'foo': 1})
    my_comm.send({'foo': 2})

    # Add a callback for received messages.
    @my_comm.on_msg
    def _recv(msg):
        # Use msg['content']['data'] for the data in the message


This example uses the IPython kernel; it's up to each language kernel what API,
if any, it offers for using comms.

Opening a comm from the frontend
--------------------------------

This is very similar to above, but in reverse. First, a comm target must be
registered in the kernel. For instance, this may be done by code displaying
output: it will register a target in the kernel, and then display output
containing Javascript to connect to it.

.. code-block:: python

    def target_func(comm, msg):
        # comm is the kernel Comm instance
        # msg is the comm_open message

        # Register handler for later messages
        @comm.on_msg
        def _recv(msg):
            # Use msg['content']['data'] for the data in the message

        # Send data to the frontend
        comm.send({'foo': 5})

    get_ipython().kernel.comm_manager.register_target('my_comm_target', target_func)

This example uses the IPython kernel again; this example will be different in
other kernels that support comms. Refer to the specific language kernel's
documentation for comms support.

And then open the comm from the frontend:

.. code-block:: javascript

    comm = Jupyter.notebook.kernel.comm_manager.new_comm('my_comm_target',
                                                         {'foo': 6})
    // Send data
    comm.send({'foo': 7})

    // Register a handler
    comm.on_msg(function(msg) {
        console.log(msg.content.data.foo);
    });
