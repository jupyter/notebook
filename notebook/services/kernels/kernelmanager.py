"""A MultiKernelManager for use in the notebook webserver

- raises HTTPErrors
- creates REST API models
"""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from collections import defaultdict
from datetime import datetime, timedelta
import os
import uuid

from tornado import gen, web
from tornado.ioloop import IOLoop, PeriodicCallback
from tornado.locks import Event

from jupyter_kernel_mgmt.client import IOLoopKernelClient
from jupyter_kernel_mgmt.restarter import TornadoKernelRestarter
from traitlets import (Any, Bool, Dict, Unicode, TraitError, Integer,
       Float, Instance, default, validate
)
from traitlets.config.configurable import LoggingConfigurable

from notebook.utils import to_os_path, exists
from notebook._tz import utcnow, isoformat
from ipython_genutils.py3compat import getcwd

from notebook.prometheus.metrics import KERNEL_CURRENTLY_RUNNING_TOTAL


class KernelInterface(LoggingConfigurable):
    """A wrapper around one kernel, including manager, client and restarter.

    A KernelInterface instance persists across kernel restarts, whereas
    manager and client objects are recreated.
    """
    def __init__(self, kernel_type, kernel_finder):
        super(KernelInterface, self).__init__()
        self.kernel_type = kernel_type
        self.kernel_finder = kernel_finder

        self.connection_info, self.manager = kernel_finder.launch(kernel_type)
        self.n_connections = 0
        self.execution_state = 'starting'
        self.last_activity = utcnow()

        self.restarter = TornadoKernelRestarter(self.manager, kernel_type,
                                           kernel_finder=self.kernel_finder)
        self.restarter.add_callback(self._handle_kernel_died, 'died')
        self.restarter.add_callback(self._handle_kernel_restarted, 'restarted')
        self.restarter.start()

        self.buffer_for_key = None
        # TODO: the buffer should likely be a memory bounded queue, we're starting with a list to keep it simple
        self.buffer = []

        # Message handlers stored here don't have to be re-added if the kernel
        # is restarted.
        self.msg_handlers = []
        # A future that resolves when the client is connected
        self.client_connected = self._connect_client()
        self._client_connected_evt = Event()

    client = None

    @gen.coroutine
    def _connect_client(self):
        """Connect a client and wait for it to be ready."""
        self.client = IOLoopKernelClient(self.connection_info, self.manager)
        yield self.client.wait_for_ready()
        self.client.add_handler(self._msg_received, {'shell', 'iopub', 'stdin'})
        self._client_connected_evt.set()

    def _close_client(self):
        if self.client is not None:
            self._client_connected_evt.clear()
            self.client_connected.cancel()
            self.client.close()
            self.client = None

    def client_ready(self):
        """Return a future which resolves when the client is ready"""
        if self.client is None:
            return self._client_connected_evt.wait()
        else:
            return self.client_connected

    def _msg_received(self, msg, channel):
        loop = IOLoop.current()
        for handler in self.msg_handlers:
            loop.add_callback(handler, msg, channel)

    @gen.coroutine
    def shutdown(self, now=False):
        self.restarter.stop()

        if now or (self.client is None):
            self.manager.kill()
        else:
            yield self.client_connected
            yield self.client.shutdown_or_terminate()

        self._close_client()
        self.manager.cleanup()

    def interrupt(self):
        self.manager.interrupt()

    @gen.coroutine
    def _handle_kernel_died(self, data):
        """Called when the auto-restarter notices the kernel has died"""
        self._close_client()

    @gen.coroutine
    def _handle_kernel_restarted(self, data):
        """Called when the kernel has been restarted"""
        self.manager = data['manager']
        self.connection_info = data['connection_info']
        self.client_connected = self._connect_client()
        yield self.client_connected

    @gen.coroutine
    def restart(self):
        yield self.shutdown()
        # The restart will trigger _handle_kernel_restarted() to connect a
        # new client.
        self.restarter.do_restart()
        # Resume monitoring the kernel for auto-restart
        self.restarter.start()
        yield self._client_connected_evt.wait()

    def start_buffering(self, session_key):
        # record the session key because only one session can buffer
        self.buffer_for_key = session_key

        # forward any future messages to the internal buffer
        self.client.add_handler(self._buffer_msg, {'shell', 'iopub', 'stdin'})

    def _buffer_msg(self, msg, channel):
        self.log.debug("Buffering msg on %s", channel)
        self.buffer.append((msg, channel))

    def get_buffer(self):
        """Get the buffer for a given kernel, and stop buffering new messages
        """
        buffer, key = self.buffer, self.buffer_for_key
        self.buffer = []
        self.stop_buffering()
        return buffer, key

    def stop_buffering(self):
        """Stop buffering kernel messages
        """
        self.client.remove_handler(self._buffer_msg)

        if self.buffer:
            self.log.info("Discarding %s buffered messages for %s",
                len(self.buffer), self.buffer_for_key)
        self.buffer = []
        self.buffer_for_key = None

class MappingKernelManager(LoggingConfigurable):
    """A KernelManager that handles notebook mapping and HTTP error handling"""

    @default('kernel_manager_class')
    def _default_kernel_manager_class(self):
        return "jupyter_client.ioloop.IOLoopKernelManager"

    default_kernel_name = Unicode('pyimport/kernel', config=True,
        help="The name of the default kernel to start"
    )

    root_dir = Unicode(config=True)
    
    _kernel_connections = Dict()

    _culler_callback = None

    _initialized_culler = False

    @default('root_dir')
    def _default_root_dir(self):
        try:
            return self.parent.notebook_dir
        except AttributeError:
            return getcwd()

    @validate('root_dir')
    def _update_root_dir(self, proposal):
        """Do a bit of validation of the root dir."""
        value = proposal['value']
        if not os.path.isabs(value):
            # If we receive a non-absolute path, make it absolute.
            value = os.path.abspath(value)
        if not exists(value) or not os.path.isdir(value):
            raise TraitError("kernel root dir %r is not a directory" % value)
        return value

    cull_idle_timeout = Integer(0, config=True,
        help="""Timeout (in seconds) after which a kernel is considered idle and ready to be culled.
        Values of 0 or lower disable culling. Very short timeouts may result in kernels being culled
        for users with poor network connections."""
    )

    cull_interval_default = 300 # 5 minutes
    cull_interval = Integer(cull_interval_default, config=True,
        help="""The interval (in seconds) on which to check for idle kernels exceeding the cull timeout value."""
    )

    cull_connected = Bool(False, config=True,
        help="""Whether to consider culling kernels which have one or more connections.
        Only effective if cull_idle_timeout > 0."""
    )

    cull_busy = Bool(False, config=True,
        help="""Whether to consider culling kernels which are busy.
        Only effective if cull_idle_timeout > 0."""
    )

    buffer_offline_messages = Bool(True, config=True,
        help="""Whether messages from kernels whose frontends have disconnected should be buffered in-memory.

        When True (default), messages are buffered and replayed on reconnect,
        avoiding lost messages due to interrupted connectivity.

        Disable if long-running kernels will produce too much output while
        no frontends are connected.
        """
    )
    
    kernel_info_timeout = Float(60, config=True,
        help="""Timeout for giving up on a kernel (in seconds).

        On starting and restarting kernels, we check whether the
        kernel is running and responsive by sending kernel_info_requests.
        This sets the timeout in seconds for how long the kernel can take
        before being presumed dead. 
        This affects the MappingKernelManager (which handles kernel restarts) 
        and the ZMQChannelsHandler (which handles the startup).
        """
    )

    _kernel_buffers = Any()
    @default('_kernel_buffers')
    def _default_kernel_buffers(self):
        return defaultdict(lambda: {'buffer': [], 'session_key': '', 'channels': {}})

    last_kernel_activity = Instance(datetime,
        help="The last activity on any kernel, including shutting down a kernel")

    def __init__(self, kernel_finder, **kwargs):
        super(MappingKernelManager, self).__init__(**kwargs)
        self.last_kernel_activity = utcnow()
        self._kernels = {}
        self._kernels_starting = {}
        self._restarters = {}
        self.kernel_finder = kernel_finder
        self.initialize_culler()

    def get_kernel(self, kernel_id):
        return self._kernels[kernel_id]

    #-------------------------------------------------------------------------
    # Methods for managing kernels and sessions
    #-------------------------------------------------------------------------

    def _handle_kernel_died(self, kernel_id):
        """notice that a kernel died"""
        self.log.warning("Kernel %s died, removing from map.", kernel_id)
        kernel = self._kernels.pop(kernel_id)
        kernel.client.close()
        kernel.manager.cleanup()

        KERNEL_CURRENTLY_RUNNING_TOTAL.labels(
            type=kernel.kernel_type
        ).inc()

    def cwd_for_path(self, path):
        """Turn API path into absolute OS path."""
        os_path = to_os_path(path, self.root_dir)
        # in the case of notebooks and kernels not being on the same filesystem,
        # walk up to root_dir if the paths don't exist
        while not os.path.isdir(os_path) and os_path != self.root_dir:
            os_path = os.path.dirname(os_path)
        return os_path

    @gen.coroutine
    def start_kernel(self, kernel_id=None, path=None, kernel_name=None, **kwargs):
        """Start a kernel for a session and return its kernel_id.

        Parameters
        ----------
        kernel_id : uuid
            The uuid to associate the new kernel with. If this
            is not None, this kernel will be persistent whenever it is
            requested.
        path : API path
            The API path (unicode, '/' delimited) for the cwd.
            Will be transformed to an OS path relative to root_dir.
        kernel_name : str
            The name identifying which kernel spec to launch. This is ignored if
            an existing kernel is returned, but it may be checked in the future.
        """
        if kernel_id is None:
            kernel_id = self.start_launching_kernel(path, kernel_name, **kwargs)
            yield self.get_kernel(kernel_id).client_ready()
        else:
            self._check_kernel_id(kernel_id)
            self.log.info("Using existing kernel: %s" % kernel_id)

        # py2-compat
        raise gen.Return(kernel_id)

    def start_launching_kernel(self, path=None, kernel_name=None, **kwargs):
        """Launch a new kernel, return its kernel ID

        This is a synchronous method which starts the process of launching a
        kernel. Retrieve the KernelInterface object and call ``.client_ready()``
        to get a future for the rest of the startup & connection.
        """
        if path is not None:
            kwargs['cwd'] = self.cwd_for_path(path)
        kernel_id = str(uuid.uuid4())
        if kernel_name is None:
            kernel_name = 'pyimport/kernel'
        elif '/' not in kernel_name:
            kernel_name = 'spec/' + kernel_name

        kernel = KernelInterface(kernel_name, self.kernel_finder)
        self._kernels[kernel_id] = kernel

        self.start_watching_activity(kernel_id)
        self.log.info("Kernel started: %s" % kernel_id)

        kernel.restarter.add_callback(
            lambda data: self._handle_kernel_died(kernel_id),
            'failed'
        )

        # Increase the metric of number of kernels running
        # for the relevant kernel type by 1
        KERNEL_CURRENTLY_RUNNING_TOTAL.labels(
            type=self._kernels[kernel_id].kernel_type
        ).inc()

        return kernel_id

    def start_buffering(self, kernel_id, session_key, channels):
        """Start buffering messages for a kernel

        Parameters
        ----------
        kernel_id : str
            The id of the kernel to stop buffering.
        session_key: str
            The session_key, if any, that should get the buffer.
            If the session_key matches the current buffered session_key,
            the buffer will be returned.
        channels: dict({'channel': ZMQStream})
            The zmq channels whose messages should be buffered.
        """

        if not self.buffer_offline_messages:
            for channel, stream in channels.items():
                stream.close()
            return

        self.log.info("Starting buffering for %s", session_key)
        self._check_kernel_id(kernel_id)
        kernel = self._kernels[kernel_id]
        # clear previous buffering state
        kernel.stop_buffering()
        kernel.start_buffering(session_key)

    @gen.coroutine
    def _shutdown_all(self):
        futures = [self.shutdown_kernel(kid) for kid in self.list_kernel_ids()]
        yield gen.multi(futures)

    def shutdown_all(self):
        # Blocking function to call when the notebook server is shutting down
        loop = IOLoop.current()
        loop.run_sync(self._shutdown_all)

    @gen.coroutine
    def shutdown_kernel(self, kernel_id, now=False):
        """Shutdown a kernel by kernel_id"""
        self._check_kernel_id(kernel_id)
        kernel = self._kernels.pop(kernel_id)
        self.log.info("Shutting down kernel %s", kernel_id)
        yield kernel.shutdown()
        self.last_kernel_activity = utcnow()

        # Decrease the metric of number of kernels
        # running for the relevant kernel type by 1
        KERNEL_CURRENTLY_RUNNING_TOTAL.labels(
            type=kernel.kernel_type
        ).dec()

    @gen.coroutine
    def restart_kernel(self, kernel_id):
        """Restart a kernel by kernel_id

        The restarted kernel keeps the same ID and KernelInterface object.
        """
        self._check_kernel_id(kernel_id)
        kernel = self.get_kernel(kernel_id)

        try:
            yield gen.with_timeout(
                timedelta(seconds=self.kernel_info_timeout),
                kernel.restart(),
            )
        except gen.TimeoutError:
            self.log.warning("Timeout waiting for kernel_info_reply: %s",
                             kernel_id)
            self._kernels.pop(kernel_id)
            # Decrease the metric of number of kernels
            # running for the relevant kernel type by 1
            KERNEL_CURRENTLY_RUNNING_TOTAL.labels(
                type=kernel.kernel_type
            ).dec()
            raise gen.TimeoutError("Timeout waiting for restart")

    def notify_connect(self, kernel_id):
        """Notice a new connection to a kernel"""
        if kernel_id in self._kernels:
            self._kernels[kernel_id].n_connections += 1

    def notify_disconnect(self, kernel_id):
        """Notice a disconnection from a kernel"""
        if kernel_id in self._kernels:
            self._kernels[kernel_id].n_connections -= 1

    def kernel_model(self, kernel_id):
        """Return a JSON-safe dict representing a kernel

        For use in representing kernels in the JSON APIs.
        """
        self._check_kernel_id(kernel_id)
        kernel = self._kernels[kernel_id]

        model = {
            "id":kernel_id,
            "name": kernel.kernel_type,
            "last_activity": isoformat(kernel.last_activity),
            "execution_state": kernel.execution_state,
            "connections": kernel.n_connections,
        }
        return model

    def list_kernels(self):
        """Returns a list of models for kernels running."""
        kernels = []
        for kernel_id in self._kernels.keys():
            model = self.kernel_model(kernel_id)
            kernels.append(model)
        return kernels

    def list_kernel_ids(self):
        return list(self._kernels.keys())

    def __contains__(self, kernel_id):
        return kernel_id in self._kernels

    # override _check_kernel_id to raise 404 instead of KeyError
    def _check_kernel_id(self, kernel_id):
        """Check a that a kernel_id exists and raise 404 if not."""
        if kernel_id not in self:
            raise web.HTTPError(404, u'Kernel does not exist: %s' % kernel_id)

    # monitoring activity:

    def start_watching_activity(self, kernel_id):
        """Start watching IOPub messages on a kernel for activity.
        
        - update last_activity on every message
        - record execution_state from status messages
        """
        kernel = self._kernels[kernel_id]

        def record_activity(msg, _channel):
            """Record an IOPub message arriving from a kernel"""
            self.last_kernel_activity = kernel.last_activity = utcnow()

            msg_type = msg.header['msg_type']
            if msg_type == 'status':
                kernel.execution_state = msg.content['execution_state']
                self.log.debug("activity on %s: %s (%s)", kernel_id, msg_type, kernel.execution_state)
            else:
                self.log.debug("activity on %s: %s", kernel_id, msg_type)

        kernel.msg_handlers.append(record_activity)

    def initialize_culler(self):
        """Start idle culler if 'cull_idle_timeout' is greater than zero.

        Regardless of that value, set flag that we've been here.
        """
        if not self._initialized_culler and self.cull_idle_timeout > 0:
            if self._culler_callback is None:
                loop = IOLoop.current()
                if self.cull_interval <= 0: #handle case where user set invalid value
                    self.log.warning("Invalid value for 'cull_interval' detected (%s) - using default value (%s).",
                        self.cull_interval, self.cull_interval_default)
                    self.cull_interval = self.cull_interval_default
                self._culler_callback = PeriodicCallback(
                    self.cull_kernels, 1000*self.cull_interval)
                self.log.info("Culling kernels with idle durations > %s seconds at %s second intervals ...",
                    self.cull_idle_timeout, self.cull_interval)
                if self.cull_busy:
                    self.log.info("Culling kernels even if busy")
                if self.cull_connected:
                    self.log.info("Culling kernels even with connected clients")
                self._culler_callback.start()

        self._initialized_culler = True

    def cull_kernels(self):
        self.log.debug("Polling every %s seconds for kernels idle > %s seconds...",
            self.cull_interval, self.cull_idle_timeout)
        """Create a separate list of kernels to avoid conflicting updates while iterating"""
        for kernel_id in list(self._kernels):
            try:
                self.cull_kernel_if_idle(kernel_id)
            except Exception as e:
                self.log.exception("The following exception was encountered while checking the idle duration of kernel %s: %s",
                    kernel_id, e)

    def cull_kernel_if_idle(self, kernel_id):
        kernel = self._kernels[kernel_id]
        self.log.debug("kernel_id=%s, kernel_name=%s, last_activity=%s", kernel_id, kernel.kernel_type, kernel.last_activity)
        if kernel.last_activity is not None:
            dt_now = utcnow()
            dt_idle = dt_now - kernel.last_activity
            # Compute idle properties
            is_idle_time = dt_idle > timedelta(seconds=self.cull_idle_timeout)
            is_idle_execute = self.cull_busy or (kernel.execution_state != 'busy')
            connections = self._kernel_connections.get(kernel_id, 0)
            is_idle_connected = self.cull_connected or not connections
            # Cull the kernel if all three criteria are met
            if (is_idle_time and is_idle_execute and is_idle_connected):
                idle_duration = int(dt_idle.total_seconds())
                self.log.warning("Culling '%s' kernel '%s' (%s) with %d connections due to %s seconds of inactivity.",
                                 kernel.execution_state, kernel.kernel_type, kernel_id, connections, idle_duration)
                kernel.shutdown()
