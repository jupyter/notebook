Eventlogging and Telemetry
==========================

The Notebook Server can be configured to record structured events from a running server using Jupyter's `Telemetry System`_. The types of events that the Notebook Server emits are defined by `JSON schemas`_ listed below_ emitted as JSON data, defined and validated by the JSON schemas listed below.


.. _logging: https://docs.python.org/3/library/logging.html
.. _`Telemetry System`: https://github.com/jupyter/telemetry
.. _`JSON schemas`: https://json-schema.org/

Emitting Server Events
----------------------

Event logging is handled by its ``Eventlog`` object. This leverages Python's standing logging_ library to emit, filter, and collect event data. 

To begin recording events, you'll need to set two configurations:

    1. ``handlers``: tells the EventLog *where* to route your events. This trait is a list of Python logging handlers that route events to 
    2. ``allows_schemas``: tells the EventLog *which* events should be recorded. No events are emitted by default; all recorded events must be listed here.

Here's a basic example for emitting events from the `contents` service:

.. code-block::

    import logging

    c.EventLog.handlers = [
        logging.FileHandler('event.log'),
    ]

    c.EventLog.allowed_schemas = [
        'hub.jupyter.org/server-action'
    ]

The output is a file, ``"event.log"``, with events recorded as JSON data.

`eventlog` endpoint
-------------------

The Notebook Server provides a public REST endpoint for external applications to validate and log events
through the Server's Event Log. 

To log events, send a `POST` request to the `/api/eventlog` endpoint. The body of the request should be a 
JSON blog and is required to have the follow keys:

    1. `'schema'` : the event's schema ID.
    2. `'version'` : the version of the event's schema.
    3. `'event'` : the event data in JSON format.

Events that are validated by this endpoint must have their schema listed in the `allowed_schemas` trait listed above.

.. _below:


Server Event schemas
--------------------

.. toctree::
   :maxdepth: 2

   events/index
