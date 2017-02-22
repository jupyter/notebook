"""A MultiKernelManager for use in the notebook webserver

- raises HTTPErrors
- creates REST API models
"""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import os

from tornado import gen, web
from tornado.concurrent import Future
from tornado.ioloop import IOLoop, PeriodicCallback

from jupyter_client.multikernelmanager import MultiKernelManager
from traitlets import Dict, List, Unicode, TraitError, Integer, default, validate

from notebook.utils import to_os_path
from notebook._tz import utcnow, isoformat
from ipython_genutils.py3compat import getcwd

from datetime import datetime, timedelta


class MappingKernelManager(MultiKernelManager):
    """A KernelManager that handles notebook mapping and HTTP error handling"""

    @default('kernel_manager_class')
    def _default_kernel_manager_class(self):
        return "jupyter_client.ioloop.IOLoopKernelManager"

    kernel_argv = List(Unicode())

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
        if not os.path.exists(value) or not os.path.isdir(value):
            raise TraitError("kernel root dir %r is not a directory" % value)
        return value

    cull_kernels_after_minutes_env = 'CULL_KERNELS_AFTER_MINUTES'
    cull_kernels_after_minutes_default = 0
    cull_kernels_after_minutes = Integer(cull_kernels_after_minutes_default, config=True,
        help="""Duration (minutes) in which a kernel must remain idle before it can be culled. Culling is disabled (0) by default."""
    )

    @default('cull_kernels_after_minutes')
    def cull_kernels_after_minutes_value(self):
        return int(os.getenv(self.cull_kernels_after_minutes_env, self.cull_kernels_after_minutes_default))

    kernel_culling_interval_seconds_env = 'KERNEL_CULLING_INTERVAL_SECONDS'
    kernel_culling_interval_seconds_default = 300 # 5 minutes
    kernel_culling_interval_seconds = Integer(kernel_culling_interval_seconds_default, config=True,
        help="""The interval (seconds) in which kernels are culled if exceeding the idle duration."""
    )

    @default('kernel_culling_interval_seconds')
    def kernel_culling_interval_seconds_value(self):
        return int(os.getenv(self.kernel_culling_interval_seconds_env, self.kernel_culling_interval_seconds_default))

    #-------------------------------------------------------------------------
    # Methods for managing kernels and sessions
    #-------------------------------------------------------------------------

    def _handle_kernel_died(self, kernel_id):
        """notice that a kernel died"""
        self.log.warning("Kernel %s died, removing from map.", kernel_id)
        self.remove_kernel(kernel_id)

    def cwd_for_path(self, path):
        """Turn API path into absolute OS path."""
        os_path = to_os_path(path, self.root_dir)
        # in the case of notebooks and kernels not being on the same filesystem,
        # walk up to root_dir if the paths don't exist
        while not os.path.isdir(os_path) and os_path != self.root_dir:
            os_path = os.path.dirname(os_path)
        return os_path
    
    @gen.coroutine
    def start_kernel(self, kernel_id=None, path=None, **kwargs):
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
            kernel_id = yield gen.maybe_future(
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
        else:
            self._check_kernel_id(kernel_id)
            self.log.info("Using existing kernel: %s" % kernel_id)

        # Initialize culling if not already
        if not self._initialized_culler:
            self.initialize_culler()

        # py2-compat
        raise gen.Return(kernel_id)
    
    def shutdown_kernel(self, kernel_id, now=False):
        """Shutdown a kernel by kernel_id"""
        self._check_kernel_id(kernel_id)
        self._kernels[kernel_id]._activity_stream.close()
        self._kernel_connections.pop(kernel_id, None)
        return super(MappingKernelManager, self).shutdown_kernel(kernel_id, now=now)

    def restart_kernel(self, kernel_id):
        """Restart a kernel by kernel_id"""
        self._check_kernel_id(kernel_id)
        super(MappingKernelManager, self).restart_kernel(kernel_id)
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
        timeout = loop.add_timeout(loop.time() + 30, on_timeout)
        return future

    def notify_connect(self, kernel_id):
        """Notice a new connection to a kernel"""
        if kernel_id in self._kernel_connections:
            self._kernel_connections[kernel_id] += 1

    def notify_disconnect(self, kernel_id):
        """Notice a disconnection from a kernel"""
        if kernel_id in self._kernel_connections:
            self._kernel_connections[kernel_id] -= 1

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
        """Returns a list of kernel_id's of kernels running."""
        kernels = []
        kernel_ids = super(MappingKernelManager, self).list_kernel_ids()
        for kernel_id in kernel_ids:
            model = self.kernel_model(kernel_id)
            kernels.append(model)
        return kernels

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
        # add busy/activity markers:
        kernel.execution_state = 'starting'
        kernel.last_activity = utcnow()
        kernel._activity_stream = kernel.connect_iopub()

        def record_activity(msg_list):
            """Record an IOPub message arriving from a kernel"""
            kernel.last_activity = utcnow()

            idents, fed_msg_list = kernel.session.feed_identities(msg_list)
            msg = kernel.session.deserialize(fed_msg_list)
            msg_type = msg['header']['msg_type']
            self.log.debug("activity on %s: %s", kernel_id, msg_type)
            if msg_type == 'status':
                kernel.execution_state = msg['content']['execution_state']

        kernel._activity_stream.on_recv(record_activity)

    def initialize_culler(self):
        """Start idle culler if 'cull_kernels_after_minutes' is greater than zero.

        Regardless of that value, set flag that we've been here.
        """
        if not self._initialized_culler and self.cull_kernels_after_minutes > 0:
            if self._culler_callback is None:
                loop = IOLoop.current()
                self._culler_callback = PeriodicCallback(
                    self.cull_kernels, 1000*self.kernel_culling_interval_seconds, loop)
                self.log.info("Culling kernels with idle durations > %s minutes at %s second intervals ...",
                    self.cull_kernels_after_minutes, self.kernel_culling_interval_seconds)
                self._culler_callback.start()

        self._initialized_culler = True

    def cull_kernels(self):
        self.log.debug("Polling every %s seconds for kernels idle > %s minutes...",
            self.kernel_culling_interval_seconds, self.cull_kernels_after_minutes)
        for kId, kernel in self._kernels.items():
            self.cull_kernel(kId, kernel)

    def cull_kernel(self, kId, kernel):
        activity = kernel.last_activity
        name = kernel.kernel_name
        self.log.debug("kId=%s, name=%s, last_activity=%s", kId, name, activity)
        if activity is not None:
            dtNow = utcnow()
            #dtActivity = datetime.strptime(activity,'%Y-%m-%dT%H:%M:%S.%f')
            dtIdle = dtNow - activity
            if dtIdle > timedelta(minutes=self.cull_kernels_after_minutes): # can be culled
                idleDuration = int(dtIdle.total_seconds()/60.0)
                self.log.warn("Culling kernel '%s' (%s) due to %s minutes of inactivity.", name, kId, idleDuration)
                self.shutdown_kernel(kId)

