"""A MultiKernelManager for use in the notebook webserver

- raises HTTPErrors
- creates REST API models
"""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from collections import defaultdict
from datetime import datetime, timedelta
from functools import partial
import os

from tornado import gen, web
from tornado.concurrent import Future
from tornado.ioloop import IOLoop, PeriodicCallback

from jupyter_client.session import Session
from jupyter_client.multikernelmanager import MultiKernelManager
from traitlets import (Any, Bool, Dict, List, Unicode, TraitError, Integer,
       Float, Instance, default, validate)
from traitlets.config.configurable import LoggingConfigurable

from notebook.utils import maybe_future, to_os_path, exists
from notebook._tz import utcnow, isoformat
from ipython_genutils.py3compat import getcwd

from notebook.prometheus.metrics import KERNEL_CURRENTLY_RUNNING_TOTAL

# Since use of AsyncMultiKernelManager is optional at the moment, don't require appropriate juptyer_client.
# This will be confirmed at runtime in notebookapp.
# TODO: remove once dependencies are updated.
try:
    from jupyter_client.multikernelmanager import AsyncMultiKernelManager
except ImportError:
    class AsyncMultiKernelManager(object):
        """Empty class to satisfy unused reference by AsyncMappingKernelManager."""
        pass


class MappingKernelManagerBase(LoggingConfigurable):
    """
        This class exists so that class-based traits relative to MappingKernelManager and AsyncMappingKernelManager
        can be satisfied since AsyncMappingKernelManager doesn't derive from the former.  It is only necessary until
        we converge to using only async, but that requires subclasses to be updated.

        Since we have this class, we'll reduce duplication of code between the disjoint classes by using this
        common superclass for configuration properties and static methods and local member variables.
    """

    kernel_argv = List(Unicode())

    root_dir = Unicode(config=True)

    _kernel_connections = Dict()

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

    cull_interval_default = 300  # 5 minutes
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

    last_kernel_activity = Instance(datetime,
        help="The last activity on any kernel, including shutting down a kernel")

    allowed_message_types = List(trait=Unicode(), config=True,
        help="""White list of allowed kernel message types.
        When the list is empty, all message types are allowed.
        """
    )

    # members used to hold composed instances
    buffering_manager = None
    kernel_culler = None
    activity_monitor = None

    def __init__(self, **kwargs):
        super(MappingKernelManagerBase, self).__init__(**kwargs)
        self.last_kernel_activity = utcnow()

        self.buffering_manager = BufferingManager(parent=self)
        self.kernel_culler = KernelCuller(parent=self)
        self.activity_monitor = ActivityMonitor(parent=self)

    def _handle_kernel_died(self, kernel_id):
        """notice that a kernel died"""
        self.log.warning("Kernel %s died, removing from map.", kernel_id)
        self.remove_kernel(kernel_id)

    def kernel_model(self, kernel_id):
        """Return a JSON-safe dict representing a kernel

        For use in representing kernels in the JSON APIs.
        """
        self._check_kernel_id(kernel_id)
        kernel = self._kernels[kernel_id]

        model = {
            "id":kernel_id,
            "name": kernel.kernel_name,
            "last_activity": isoformat(kernel.last_activity),
            "execution_state": kernel.execution_state,
            "connections": self._kernel_connections[kernel_id],
        }
        return model

    def list_kernels(self):
        """Returns a list of kernel models relative to the running kernels."""
        kernels = []
        kernel_ids = self.list_kernel_ids()
        for kernel_id in kernel_ids:
            model = self.kernel_model(kernel_id)
            kernels.append(model)
        return kernels

    # override _check_kernel_id to raise 404 instead of KeyError
    def _check_kernel_id(self, kernel_id):
        """Check a that a kernel_id exists and raise 404 if not."""
        if kernel_id not in self:
            raise web.HTTPError(404, u'Kernel does not exist: %s' % kernel_id)

    def cwd_for_path(self, path):
        """Turn API path into absolute OS path."""
        os_path = to_os_path(path, self.root_dir)
        # in the case of notebooks and kernels not being on the same filesystem,
        # walk up to root_dir if the paths don't exist
        while not os.path.isdir(os_path) and os_path != self.root_dir:
            os_path = os.path.dirname(os_path)
        return os_path

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
        self.buffering_manager.start_buffering(kernel_id, session_key, channels)

    def get_buffer(self, kernel_id, session_key):
        """Get the buffer for a given kernel

        Parameters
        ----------
        kernel_id : str
            The id of the kernel to stop buffering.
        session_key: str, optional
            The session_key, if any, that should get the buffer.
            If the session_key matches the current buffered session_key,
            the buffer will be returned.
        """
        return self.buffering_manager.get_buffer(kernel_id, session_key)

    def stop_buffering(self, kernel_id):
        """Stop buffering kernel messages

        Parameters
        ----------
        kernel_id : str
            The id of the kernel to stop buffering.
        """
        self.buffering_manager.stop_buffering(kernel_id)

    def notify_connect(self, kernel_id):
        """Notice a new connection to a kernel"""
        if kernel_id in self._kernel_connections:
            self._kernel_connections[kernel_id] += 1

    def notify_disconnect(self, kernel_id):
        """Notice a disconnection from a kernel"""
        if kernel_id in self._kernel_connections:
            self._kernel_connections[kernel_id] -= 1

    # monitoring activity:

    def start_watching_activity(self, kernel_id):
        """Start watching IOPub messages on a kernel for activity.  Remove if no overrides

        - update last_activity on every message
        - record execution_state from status messages
        """
        self.activity_monitor.start_watching_activity(kernel_id, self._kernels[kernel_id])

    def initialize_culler(self):
        """Initial culler if not already.  Remove if no overrides
        """
        if self.kernel_culler is None:
            self.kernel_culler = KernelCuller(parent=self)

    def cull_kernels(self):
        # Defer to KernelCuller.  Remove if no overrides
        self.kernel_culler.cull_kernels()

    def cull_kernel_if_idle(self, kernel_id):
        # Defer to KernelCuller.  Remove if no overrides
        self.kernel_culler.cull_kernel_if_idle(kernel_id)


class MappingKernelManager(MappingKernelManagerBase, MultiKernelManager):
    """A KernelManager that handles notebook mapping and HTTP error handling"""

    @default('kernel_manager_class')
    def _default_kernel_manager_class(self):
        return "jupyter_client.ioloop.IOLoopKernelManager"

    def __init__(self, **kwargs):
        super(MappingKernelManager, self).__init__(**kwargs)

    # -------------------------------------------------------------------------
    # Methods for managing kernels and sessions
    # -------------------------------------------------------------------------

    async def start_kernel(self, kernel_id=None, path=None, **kwargs):
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
            if path is not None:
                kwargs['cwd'] = self.cwd_for_path(path)
            kernel_id = await maybe_future(
                super(MappingKernelManager, self).start_kernel(**kwargs)
            )
            self._kernel_connections[kernel_id] = 0
            self.start_watching_activity(kernel_id)
            self.log.info("Kernel started: %s" % kernel_id)
            self.log.debug("Kernel args: %r" % kwargs)
            # register callback for failed auto-restart
            self.add_restart_callback(kernel_id,
                lambda : self._handle_kernel_died(kernel_id),
                'dead',
            )

            # Increase the metric of number of kernels running
            # for the relevant kernel type by 1
            KERNEL_CURRENTLY_RUNNING_TOTAL.labels(
                type=self._kernels[kernel_id].kernel_name
            ).inc()

        else:
            self._check_kernel_id(kernel_id)
            self.log.info("Using existing kernel: %s" % kernel_id)

        return kernel_id

    def shutdown_kernel(self, kernel_id, now=False):
        """Shutdown a kernel by kernel_id"""
        self._check_kernel_id(kernel_id)
        kernel = self._kernels[kernel_id]
        if kernel._activity_stream:
            kernel._activity_stream.close()
            kernel._activity_stream = None
        self.stop_buffering(kernel_id)
        self._kernel_connections.pop(kernel_id, None)

        # Decrease the metric of number of kernels
        # running for the relevant kernel type by 1
        KERNEL_CURRENTLY_RUNNING_TOTAL.labels(
            type=self._kernels[kernel_id].kernel_name
        ).dec()

        return super(MappingKernelManager, self).shutdown_kernel(kernel_id, now=now)

    async def restart_kernel(self, kernel_id):
        """Restart a kernel by kernel_id"""
        self._check_kernel_id(kernel_id)
        await maybe_future(super(MappingKernelManager, self).restart_kernel(kernel_id))
        kernel = self.get_kernel(kernel_id)
        # return a Future that will resolve when the kernel has successfully restarted
        channel = kernel.connect_shell()
        future = Future()

        def finish():
            """Common cleanup when restart finishes/fails for any reason."""
            if not channel.closed():
                channel.close()
            loop.remove_timeout(timeout)
            kernel.remove_restart_callback(on_restart_failed, 'dead')

        def on_reply(msg):
            self.log.debug("Kernel info reply received: %s", kernel_id)
            finish()
            if not future.done():
                future.set_result(msg)

        def on_timeout():
            self.log.warning("Timeout waiting for kernel_info_reply: %s", kernel_id)
            finish()
            if not future.done():
                future.set_exception(gen.TimeoutError("Timeout waiting for restart"))

        def on_restart_failed():
            self.log.warning("Restarting kernel failed: %s", kernel_id)
            finish()
            if not future.done():
                future.set_exception(RuntimeError("Restart failed"))

        kernel.add_restart_callback(on_restart_failed, 'dead')
        kernel.session.send(channel, "kernel_info_request")
        channel.on_recv(on_reply)
        loop = IOLoop.current()
        timeout = loop.add_timeout(loop.time() + self.kernel_info_timeout, on_timeout)
        # wait for restart to complete
        await future


class AsyncMappingKernelManager(MappingKernelManagerBase, AsyncMultiKernelManager):
    """A KernelManager that handles notebook mapping and HTTP error handling using coroutines throughout"""

    @default('kernel_manager_class')
    def _default_kernel_manager_class(self):
        return "jupyter_client.ioloop.AsyncIOLoopKernelManager"

    def __init__(self, **kwargs):
        super(AsyncMappingKernelManager, self).__init__(**kwargs)

    # -------------------------------------------------------------------------
    # Methods for managing kernels and sessions
    # -------------------------------------------------------------------------

    async def start_kernel(self, kernel_id=None, path=None, **kwargs):
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
            if path is not None:
                kwargs['cwd'] = self.cwd_for_path(path)
            kernel_id = await super(AsyncMappingKernelManager, self).start_kernel(**kwargs)

            self._kernel_connections[kernel_id] = 0
            self.start_watching_activity(kernel_id)
            self.log.info("Kernel started (async): %s" % kernel_id)
            self.log.debug("Kernel args: %r" % kwargs)
            # register callback for failed auto-restart
            self.add_restart_callback(kernel_id,
                lambda: self._handle_kernel_died(kernel_id),
                'dead',
            )

            # Increase the metric of number of kernels running
            # for the relevant kernel type by 1
            KERNEL_CURRENTLY_RUNNING_TOTAL.labels(
                type=self._kernels[kernel_id].kernel_name
            ).inc()

        else:
            self._check_kernel_id(kernel_id)
            self.log.info("Using existing kernel: %s" % kernel_id)

        return kernel_id

    async def shutdown_kernel(self, kernel_id, now=False, restart=False):
        """Shutdown a kernel by kernel_id"""
        self._check_kernel_id(kernel_id)
        kernel = self._kernels[kernel_id]
        if kernel._activity_stream:
            kernel._activity_stream.close()
            kernel._activity_stream = None
        self.stop_buffering(kernel_id)
        self._kernel_connections.pop(kernel_id, None)
        self.last_kernel_activity = utcnow()

        # Decrease the metric of number of kernels
        # running for the relevant kernel type by 1
        KERNEL_CURRENTLY_RUNNING_TOTAL.labels(
            type=self._kernels[kernel_id].kernel_name
        ).dec()

        await super(AsyncMappingKernelManager, self).shutdown_kernel(kernel_id, now=now, restart=restart)

    async def restart_kernel(self, kernel_id, now=False):
        """Restart a kernel by kernel_id"""
        self._check_kernel_id(kernel_id)
        await super(AsyncMappingKernelManager, self).restart_kernel(kernel_id, now=now)
        kernel = self.get_kernel(kernel_id)
        # return a Future that will resolve when the kernel has successfully restarted
        channel = kernel.connect_shell()
        future = Future()

        def finish():
            """Common cleanup when restart finishes/fails for any reason."""
            if not channel.closed():
                channel.close()
            loop.remove_timeout(timeout)
            kernel.remove_restart_callback(on_restart_failed, 'dead')

        def on_reply(msg):
            self.log.debug("Kernel info reply received: %s", kernel_id)
            finish()
            if not future.done():
                future.set_result(msg)

        def on_timeout():
            self.log.warning("Timeout waiting for kernel_info_reply: %s", kernel_id)
            finish()
            if not future.done():
                future.set_exception(gen.TimeoutError("Timeout waiting for restart"))

        def on_restart_failed():
            self.log.warning("Restarting kernel failed: %s", kernel_id)
            finish()
            if not future.done():
                future.set_exception(RuntimeError("Restart failed"))

        kernel.add_restart_callback(on_restart_failed, 'dead')
        kernel.session.send(channel, "kernel_info_request")
        channel.on_recv(on_reply)
        loop = IOLoop.current()
        timeout = loop.add_timeout(loop.time() + self.kernel_info_timeout, on_timeout)
        return future


class ActivityMonitor(LoggingConfigurable):
    """Establishes activity recorder for each active kernel"""

    def __init__(self, **kwargs):
        super(ActivityMonitor, self).__init__(**kwargs)
        if not isinstance(self.parent, MappingKernelManagerBase):
            raise RuntimeError(
                "ActivityMonitor requires an instance of MappingKernelManagerBase!")

    def start_watching_activity(self, kernel_id, kernel):
        """Start watching IOPub messages on a kernel for activity.

        - update last_activity on every message
        - record execution_state from status messages
        """
        # add busy/activity markers:
        kernel.execution_state = 'starting'
        kernel.last_activity = utcnow()
        kernel._activity_stream = kernel.connect_iopub()
        session = Session(
            config=kernel.session.config,
            key=kernel.session.key,
        )

        def record_activity(msg_list):
            """Record an IOPub message arriving from a kernel"""
            self.parent.last_kernel_activity = kernel.last_activity = utcnow()

            idents, fed_msg_list = session.feed_identities(msg_list)
            msg = session.deserialize(fed_msg_list)

            msg_type = msg['header']['msg_type']
            if msg_type == 'status':
                kernel.execution_state = msg['content']['execution_state']
                self.log.debug("activity on %s: %s (%s)", kernel_id, msg_type, kernel.execution_state)
            else:
                self.log.debug("activity on %s: %s", kernel_id, msg_type)

        kernel._activity_stream.on_recv(record_activity)


class BufferingManager(LoggingConfigurable):
    """Manages buffering across the active kernels"""
    _kernel_buffers = Any()

    @default('_kernel_buffers')
    def _default_kernel_buffers(self):
        return defaultdict(lambda: {'buffer': [], 'session_key': '', 'channels': {}})

    def __init__(self, **kwargs):
        super(BufferingManager, self).__init__(**kwargs)
        if not isinstance(self.parent, MappingKernelManagerBase):
            raise RuntimeError(
                "BufferingManager requires an instance of MappingKernelManagerBase!")

    def _check_kernel_id(self, kernel_id):
        """Check a that a kernel_id exists and raise 404 if not."""
        if kernel_id not in self.parent:
            raise web.HTTPError(404, u'Kernel does not exist: %s' % kernel_id)

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

        if not self.parent.buffer_offline_messages:
            for channel, stream in channels.items():
                stream.close()
            return

        self._check_kernel_id(kernel_id)
        self.log.info("Starting buffering for %s", session_key)
        # clear previous buffering state
        self.parent.stop_buffering(kernel_id)
        buffer_info = self._kernel_buffers[kernel_id]
        # record the session key because only one session can buffer
        buffer_info['session_key'] = session_key
        # TODO: the buffer should likely be a memory bounded queue, we're starting with a list to keep it simple
        buffer_info['buffer'] = []
        buffer_info['channels'] = channels

        # forward any future messages to the internal buffer
        def buffer_msg(channel, msg_parts):
            self.log.debug("Buffering msg on %s:%s", kernel_id, channel)
            buffer_info['buffer'].append((channel, msg_parts))

        for channel, stream in channels.items():
            stream.on_recv(partial(buffer_msg, channel))

    def get_buffer(self, kernel_id, session_key):
        """Get the buffer for a given kernel

        Parameters
        ----------
        kernel_id : str
            The id of the kernel to stop buffering.
        session_key: str, optional
            The session_key, if any, that should get the buffer.
            If the session_key matches the current buffered session_key,
            the buffer will be returned.
        """
        if kernel_id not in self._kernel_buffers:
            return

        self.log.debug("Getting buffer for %s", kernel_id)
        buffer_info = self._kernel_buffers[kernel_id]
        if buffer_info['session_key'] == session_key:
            # remove buffer
            self._kernel_buffers.pop(kernel_id)
            # only return buffer_info if it's a match
            return buffer_info
        else:
            self.parent.stop_buffering(kernel_id)

    def stop_buffering(self, kernel_id):
        """Stop buffering kernel messages

        Parameters
        ----------
        kernel_id : str
            The id of the kernel to stop buffering.
        """
        self._check_kernel_id(kernel_id)

        if kernel_id not in self._kernel_buffers:
            return
        self.log.debug("Clearing buffer for %s", kernel_id)
        buffer_info = self._kernel_buffers.pop(kernel_id)
        # close buffering streams
        for stream in buffer_info['channels'].values():
            if not stream.closed():
                stream.on_recv(None)
                stream.close()

        msg_buffer = buffer_info['buffer']
        if msg_buffer:
            self.log.info("Discarding %s buffered messages for %s",
                len(msg_buffer), buffer_info['session_key'])


class KernelCuller(LoggingConfigurable):
    """Handles culling responsibilities for active kernels"""

    def __init__(self, **kwargs):
        super(KernelCuller, self).__init__(**kwargs)
        if not isinstance(self.parent, MappingKernelManagerBase):
            raise RuntimeError(
                "KernelCuller requires an instance of MappingKernelManagerBase!")
        self.cull_state = "idle" if not self.parent.cull_busy else "inactive"  # used during logging

        # Start idle culler if 'cull_idle_timeout' is greater than zero.
        # Regardless of that value, set flag that we've been here.
        if self.parent.cull_idle_timeout > 0:
            if self.parent.cull_interval <= 0:  # handle case where user set invalid value
                self.log.warning("Invalid value for 'cull_interval' detected (%s) - using default value (%s).",
                                 self.parent.cull_interval, self.parent.cull_interval_default)
                self.parent.cull_interval = self.parent.cull_interval_default
            self._culler_callback = PeriodicCallback(
                self.parent.cull_kernels, 1000*self.parent.cull_interval)
            self._culler_callback.start()
            self._log_info()

    def _log_info(self):
        """Builds a single informational message relative to the culling configuration (logged at startup)."""
        log_msg = list()
        log_msg.append("Culling kernels with {cull_state} durations > {timeout} seconds at {interval} second intervals".
                       format(cull_state=self.cull_state, timeout=self.parent.cull_idle_timeout,
                              interval=self.parent.cull_interval))
        if self.parent.cull_busy or self.parent.cull_connected:
            log_msg.append(" - including")
            if self.parent.cull_busy:
                log_msg.append(" busy")
                if self.parent.cull_connected:
                    log_msg.append(" and")
            if self.parent.cull_connected:
                log_msg.append(" connected")
            log_msg.append(" kernels")
        log_msg.append(".")
        self.log.info(''.join(log_msg))

    async def cull_kernels(self):
        self.log.debug("Polling every %s seconds for kernels %s > %s seconds...",
                       self.parent.cull_interval, self.cull_state, self.parent.cull_idle_timeout)
        # Get a separate list of kernels to avoid conflicting updates while iterating
        for kernel_id in self.parent.list_kernel_ids():
            await self.parent.cull_kernel_if_idle(kernel_id)

    async def cull_kernel_if_idle(self, kernel_id):

        # Get the kernel model and use that to determine cullability...
        try:
            model = self.parent.kernel_model(kernel_id)
            self.log.debug("kernel_id=%s, kernel_name=%s, last_activity=%s",
                        kernel_id, model['name'], model['last_activity'])

            if model['last_activity'] is not None:
                # Convert dates to compatible formats. Since both are UTC, strip the TZ info from
                # the current time and convert the last_activity string to a datetime.
                dt_now = utcnow().replace(tzinfo=None)
                dt_last_activity = datetime.strptime(model['last_activity'], "%Y-%m-%dT%H:%M:%S.%fZ")
                dt_idle = dt_now - dt_last_activity
                # Compute idle properties
                is_idle_time = dt_idle > timedelta(seconds=self.parent.cull_idle_timeout)
                is_idle_execute = self.parent.cull_busy or (model['execution_state'] != 'busy')
                connections = model.get('connections', 0)
                is_idle_connected = self.parent.cull_connected or connections == 0
                # Cull the kernel if all three criteria are met
                if is_idle_time and is_idle_execute and is_idle_connected:
                    idle_duration = int(dt_idle.total_seconds())
                    self.log.warning(
                        "Culling '%s' kernel '%s' (%s) with %d connections due to %s seconds of inactivity.",
                        model['execution_state'], model['name'], kernel_id, connections, idle_duration)
                    await maybe_future(self.parent.shutdown_kernel(kernel_id))
        except KeyError:
            pass  # KeyErrors are somewhat expected since the kernel can be shutdown as the culling check is made.
        except Exception as e:  # other errors are not as expected, so we'll make some noise, but continue.
            self.log.exception("The following exception was encountered while checking the idle "
                               "duration of kernel %s: %s", kernel_id, e)
