"""A MultiKernelManager for use in the notebook webserver

- raises HTTPErrors
- creates REST API models
"""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import os

from tornado import gen, web
from tornado.concurrent import Future
from tornado.ioloop import IOLoop

from jupyter_client.multikernelmanager import MultiKernelManager
from traitlets import Dict, List, Unicode, TraitError, default, validate

from notebook.utils import to_os_path
from notebook._tz import utcnow, isoformat
from ipython_genutils.py3compat import getcwd


class MappingKernelManager(MultiKernelManager):
    """A KernelManager that handles notebook mapping and HTTP error handling"""

    @default('kernel_manager_class')
    def _default_kernel_manager_class(self):
        return "jupyter_client.ioloop.IOLoopKernelManager"

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
        if not os.path.exists(value) or not os.path.isdir(value):
            raise TraitError("kernel root dir %r is not a directory" % value)
        return value

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

