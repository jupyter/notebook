Kernels
=======

When a kernel is created or connected to via the `RESTful
API <http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml>`__, the notebook server sets up a websocket to ZeroMQ bridge for communicating with the kernel. On kernel start, the notebook sends a ``request_kernel_info`` message to the kernel in order to initiate communication and to retrieve the kernel message spec version the kernel implements. The notebook automatically adapts messages from the kernel spec version the kernel implements to the kernel spec implemented by the current version of jupyter_client installed.

Restarting or shutting down a kernel should be done with a RESTful request, not through a kernel message, so that the kernel manager can do the appropriate logic around kernel shutdown, like asking the kernel to shut down first through a kernel message, then forcefully shutting down the kernel if there is no response.


Kernel messages
---------------

A websocket client connecting to a kernel through the notebook server websocket bridge will use messages according to the Jupyter kernel message spec, with the modifications noted below.

Kernel Message Specification Changes
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Message Channels**

The notebook server multiplexes all kernel message channels into a single websocket channel. The new top-level ``channel`` key in each websocket message identifies the channel for the message, such as ``'control'``, ``'shell'``, or ``'iopub'``.

.. note::

    TODO If the channel is missing in a message to the notebook server, it is assumed to be the ``shell`` channel.

    Do we want to explicitly document and rely on this behavior, or just make this an undocumented nicety?)

**Kernel Status**

The notebook server sends several kernel status messages (with ``channel: 'iopub'``) beyond the kernel status messages that are sent by the kernel itself:

1. When a kernel is restarted, an ``execution_state: 'restarting'`` kernel status message is sent.
2. When a kernel dies, an ``execution_state: 'dead'`` kernel status message is sent.

These status messages will have a different message header ``session`` value than the message header session values in actual kernel messages.

.. note::

    TODO

    should we say that the session value of these is the same as the "session_id" in the kernel connection URL, and corresponds (maybe?) to the session id on the server connecting the filename to the kernel.

.. note::

    In the classic notebook and JupyterLab client code, the websocket connection is closed when explicitly requesting a restart or shutdown, so the restarting and dead messages aren't received if it was requested by the user. In those cases, receiving a ``restarting`` or ``dead`` message from the notebook server means that the kernel had something happen to it, and the user should be explicitly notified.

**IOpub Message Rate Limits**

The notebook server inspects the messages coming from the kernel to the client to rate-limit iopub messages. These rate limits can be raised.


Websocket Wire protocol
~~~~~~~~~~~~~~~~~~~~~~~

A kernel message websocket frame can be either a text or binary frame. A message without associated binary buffers is serialized as a JSON string and sent as a text websocket frame.

If a message has one or more associated binary buffers, the message and the buffers are serialized to a binary websocket frame. This frame starts with the following header:

* 4 bytes: number of frame parts (``parts``) as a big-endian unsigned 32-bit integer
* ``4 * parts`` bytes: offset for each frame part as a big-endian unsigned 32-bit integer. Offsets are from the start of the frame, including the header.

The first frame part is the message serialized to JSON and encoded as UTF-8. The rest of the frame parts are the binary buffers associated with the message.

.. note::
    Should we explicitly say how we are serializing dates?

Buffering
~~~~~~~~~

If all websocket clients have disconnected from a kernel, the notebook server will temporarily buffer messages from the kernel to be delivered to the first websocket client that connects to the kernel.

.. note::
    In the classic notebook client and JupyterLab, requesting a kernel restart immediately closes all websocket connections to the kernel, so kernel buffering starts. When a new websocket connection is created connecting to the kernel, the notebook server transmits all of the messages buffered from the kernel. For the IPython kernel, this means the new websocket connection will start with receiving status busy, shutdown_reply, and status idle messages on the iopub channel from before the restart.

.. note::

    TODO
    
    Document the session URL parameter used in kernel connections. Is that created every time we request a kernel with a post request? Is it tied to just creating new sessions with the session rest api?