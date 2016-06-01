"""Tornado handlers for kernels.

Preliminary documentation at https://github.com/ipython/ipython/wiki/IPEP-16%3A-Notebook-multi-directory-dashboard-and-URL-mapping#kernels-api
"""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import json
import logging
from tornado import gen, web
from tornado.concurrent import Future
from tornado.ioloop import IOLoop

from jupyter_client.jsonutil import date_default
from ipython_genutils.py3compat import cast_unicode
from notebook.utils import url_path_join, url_escape

from ...base.handlers import APIHandler, json_errors
from ...base.zmqhandlers import AuthenticatedZMQStreamHandler, deserialize_binary_message

from jupyter_client import protocol_version as client_protocol_version

class MainKernelHandler(APIHandler):

    @web.authenticated
    @json_errors
    @gen.coroutine
    def get(self):
        km = self.kernel_manager
        kernels = yield gen.maybe_future(km.list_kernels())
        self.finish(json.dumps(kernels))

    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self):
        km = self.kernel_manager
        model = self.get_json_body()
        if model is None:
            model = {
                'name': km.default_kernel_name
            }
        else:
            model.setdefault('name', km.default_kernel_name)

        kernel_id = yield gen.maybe_future(km.start_kernel(kernel_name=model['name']))
        model = km.kernel_model(kernel_id)
        location = url_path_join(self.base_url, 'api', 'kernels', url_escape(kernel_id))
        self.set_header('Location', location)
        self.set_status(201)
        self.finish(json.dumps(model))


class KernelHandler(APIHandler):

    @web.authenticated
    @json_errors
    def get(self, kernel_id):
        km = self.kernel_manager
        km._check_kernel_id(kernel_id)
        model = km.kernel_model(kernel_id)
        self.finish(json.dumps(model))

    @web.authenticated
    @json_errors
    @gen.coroutine
    def delete(self, kernel_id):
        km = self.kernel_manager
        yield gen.maybe_future(km.shutdown_kernel(kernel_id))
        self.set_status(204)
        self.finish()


class KernelActionHandler(APIHandler):

    @web.authenticated
    @json_errors
    @gen.coroutine
    def post(self, kernel_id, action):
        km = self.kernel_manager
        if action == 'interrupt':
            km.interrupt_kernel(kernel_id)
            self.set_status(204)
        if action == 'restart':

            try:
                yield gen.maybe_future(km.restart_kernel(kernel_id))
            except Exception as e:
                self.log.error("Exception restarting kernel", exc_info=True)
                self.set_status(500)
            else:
                model = km.kernel_model(kernel_id)
                self.write(json.dumps(model))
        self.finish()


class ZMQChannelsHandler(AuthenticatedZMQStreamHandler):
    
    # class-level registry of open sessions
    # allows checking for conflict on session-id,
    # which is used as a zmq identity and must be unique.
    _open_sessions = {}

    @property
    def kernel_info_timeout(self):
        return self.settings.get('kernel_info_timeout', 10)

    @property
    def iopub_msg_rate_limit(self):
        return self.settings.get('iopub_msg_rate_limit', None)

    @property
    def iopub_data_rate_limit(self):
        return self.settings.get('iopub_data_rate_limit', None)

    @property
    def rate_limit_window(self):
        return self.settings.get('rate_limit_window', 1.0)

    def __repr__(self):
        return "%s(%s)" % (self.__class__.__name__, getattr(self, 'kernel_id', 'uninitialized'))

    def create_stream(self):
        km = self.kernel_manager
        identity = self.session.bsession
        for channel in ('shell', 'iopub', 'stdin'):
            meth = getattr(km, 'connect_' + channel)
            self.channels[channel] = stream = meth(self.kernel_id, identity=identity)
            stream.channel = channel
        km.add_restart_callback(self.kernel_id, self.on_kernel_restarted)
        km.add_restart_callback(self.kernel_id, self.on_restart_failed, 'dead')
    
    def request_kernel_info(self):
        """send a request for kernel_info"""
        km = self.kernel_manager
        kernel = km.get_kernel(self.kernel_id)
        try:
            # check for previous request
            future = kernel._kernel_info_future
        except AttributeError:
            self.log.debug("Requesting kernel info from %s", self.kernel_id)
            # Create a kernel_info channel to query the kernel protocol version.
            # This channel will be closed after the kernel_info reply is received.
            if self.kernel_info_channel is None:
                self.kernel_info_channel = km.connect_shell(self.kernel_id)
            self.kernel_info_channel.on_recv(self._handle_kernel_info_reply)
            self.session.send(self.kernel_info_channel, "kernel_info_request")
            # store the future on the kernel, so only one request is sent
            kernel._kernel_info_future = self._kernel_info_future
        else:
            if not future.done():
                self.log.debug("Waiting for pending kernel_info request")
            future.add_done_callback(lambda f: self._finish_kernel_info(f.result()))
        return self._kernel_info_future
    
    def _handle_kernel_info_reply(self, msg):
        """process the kernel_info_reply
        
        enabling msg spec adaptation, if necessary
        """
        idents,msg = self.session.feed_identities(msg)
        try:
            msg = self.session.deserialize(msg)
        except:
            self.log.error("Bad kernel_info reply", exc_info=True)
            self._kernel_info_future.set_result({})
            return
        else:
            info = msg['content']
            self.log.debug("Received kernel info: %s", info)
            if msg['msg_type'] != 'kernel_info_reply' or 'protocol_version' not in info:
                self.log.error("Kernel info request failed, assuming current %s", info)
                info = {}
            self._finish_kernel_info(info)
        
        # close the kernel_info channel, we don't need it anymore
        if self.kernel_info_channel:
            self.kernel_info_channel.close()
        self.kernel_info_channel = None
    
    def _finish_kernel_info(self, info):
        """Finish handling kernel_info reply
        
        Set up protocol adaptation, if needed,
        and signal that connection can continue.
        """
        protocol_version = info.get('protocol_version', client_protocol_version)
        if protocol_version != client_protocol_version:
            self.session.adapt_version = int(protocol_version.split('.')[0])
            self.log.info("Adapting to protocol v%s for kernel %s", protocol_version, self.kernel_id)
        if not self._kernel_info_future.done():
            self._kernel_info_future.set_result(info)
    
    def initialize(self):
        super(ZMQChannelsHandler, self).initialize()
        self.zmq_stream = None
        self.channels = {}
        self.kernel_id = None
        self.kernel_info_channel = None
        self._kernel_info_future = Future()
        self._close_future = Future()
        self.session_key = ''

        # Rate limiting code
        self._iopub_window_msg_count = 0
        self._iopub_window_byte_count = 0
        self._iopub_msgs_exceeded = False
        self._iopub_data_exceeded = False
        # Queue of (time stamp, byte count)
        # Allows you to specify that the byte count should be lowered
        # by a delta amount at some point in the future.
        self._iopub_window_byte_queue = []

    @gen.coroutine
    def pre_get(self):
        # authenticate first
        super(ZMQChannelsHandler, self).pre_get()
        # check session collision:
        yield self._register_session()
        # then request kernel info, waiting up to a certain time before giving up.
        # We don't want to wait forever, because browsers don't take it well when
        # servers never respond to websocket connection requests.
        kernel = self.kernel_manager.get_kernel(self.kernel_id)
        self.session.key = kernel.session.key
        future = self.request_kernel_info()
        
        def give_up():
            """Don't wait forever for the kernel to reply"""
            if future.done():
                return
            self.log.warn("Timeout waiting for kernel_info reply from %s", self.kernel_id)
            future.set_result({})
        loop = IOLoop.current()
        loop.add_timeout(loop.time() + self.kernel_info_timeout, give_up)
        # actually wait for it
        yield future
    
    @gen.coroutine
    def get(self, kernel_id):
        self.kernel_id = cast_unicode(kernel_id, 'ascii')
        yield super(ZMQChannelsHandler, self).get(kernel_id=kernel_id)
    
    @gen.coroutine
    def _register_session(self):
        """Ensure we aren't creating a duplicate session.
        
        If a previous identical session is still open, close it to avoid collisions.
        This is likely due to a client reconnecting from a lost network connection,
        where the socket on our side has not been cleaned up yet.
        """
        self.session_key = '%s:%s' % (self.kernel_id, self.session.session)
        stale_handler = self._open_sessions.get(self.session_key)
        if stale_handler:
            self.log.warning("Replacing stale connection: %s", self.session_key)
            yield stale_handler.close()
        self._open_sessions[self.session_key] = self
    
    def open(self, kernel_id):
        super(ZMQChannelsHandler, self).open()
        try:
            self.create_stream()
        except web.HTTPError as e:
            self.log.error("Error opening stream: %s", e)
            # WebSockets don't response to traditional error codes so we
            # close the connection.
            for channel, stream in self.channels.items():
                if not stream.closed():
                    stream.close()
            self.close()
        else:
            for channel, stream in self.channels.items():
                stream.on_recv_stream(self._on_zmq_reply)

    def on_message(self, msg):
        if not self.channels:
            # already closed, ignore the message
            self.log.debug("Received message on closed websocket %r", msg)
            return
        if isinstance(msg, bytes):
            msg = deserialize_binary_message(msg)
        else:
            msg = json.loads(msg)
        channel = msg.pop('channel', None)
        if channel is None:
            self.log.warn("No channel specified, assuming shell: %s", msg)
            channel = 'shell'
        if channel not in self.channels:
            self.log.warn("No such channel: %r", channel)
            return
        stream = self.channels[channel]
        self.session.send(stream, msg)
        
    def _on_zmq_reply(self, stream, msg_list):
        idents, fed_msg_list = self.session.feed_identities(msg_list)
        msg = self.session.deserialize(fed_msg_list)
        parent = msg['parent_header']
        def write_stderr(error_message):
            self.log.warn(error_message)
            msg = self.session.msg("stream",
                content={"text": error_message, "name": "stderr"},
                parent=parent
            )
            msg['channel'] = 'iopub'
            self.write_message(json.dumps(msg, default=date_default))
            
        channel = getattr(stream, 'channel', None)
        msg_type = msg['header']['msg_type']
        if channel == 'iopub' and msg_type not in {'status', 'comm_open', 'execute_input'}:
            
            # Remove the counts queued for removal.
            now = IOLoop.current().time()
            while len(self._iopub_window_byte_queue) > 0:
                queued = self._iopub_window_byte_queue[0]
                if (now >= queued[0]):
                    self._iopub_window_byte_count -= queued[1]
                    self._iopub_window_msg_count -= 1
                    del self._iopub_window_byte_queue[0]
                else:
                    # This part of the queue hasn't be reached yet, so we can
                    # abort the loop.
                    break
                    
            # Increment the bytes and message count
            self._iopub_window_msg_count += 1
            byte_count = sum([len(x) for x in msg_list])
            self._iopub_window_byte_count += byte_count
            
            # Queue a removal of the byte and message count for a time in the 
            # future, when we are no longer interested in it.
            self._iopub_window_byte_queue.append((now + self.rate_limit_window, byte_count))
            
            # Check the limits, set the limit flags, and reset the
            # message and data counts.
            msg_rate = float(self._iopub_window_msg_count) / self.rate_limit_window
            data_rate = float(self._iopub_window_byte_count) / self.rate_limit_window
            
            # Check the msg rate
            if self.iopub_msg_rate_limit is not None and msg_rate > self.iopub_msg_rate_limit and self.iopub_msg_rate_limit > 0:
                if not self._iopub_msgs_exceeded:
                    self._iopub_msgs_exceeded = True
                    write_stderr("""iopub message rate exceeded.  The
                    notebook server will temporarily stop sending iopub
                    messages to the client in order to avoid crashing it.
                    To change this limit, set the config variable
                    `--NotebookApp.iopub_msg_rate_limit`.""")
                    return
            else:
                if self._iopub_msgs_exceeded:
                    self._iopub_msgs_exceeded = False
                    if not self._iopub_data_exceeded:
                        self.log.warn("iopub messages resumed")
    
            # Check the data rate
            if self.iopub_data_rate_limit is not None and data_rate > self.iopub_data_rate_limit and self.iopub_data_rate_limit > 0:
                if not self._iopub_data_exceeded:
                    self._iopub_data_exceeded = True
                    write_stderr("""iopub data rate exceeded.  The
                    notebook server will temporarily stop sending iopub
                    messages to the client in order to avoid crashing it.
                    To change this limit, set the config variable
                    `--NotebookApp.iopub_data_rate_limit`.""")
                    return
            else:
                if self._iopub_data_exceeded:
                    self._iopub_data_exceeded = False
                    if not self._iopub_msgs_exceeded:
                        self.log.warn("iopub messages resumed")
        
            # If either of the limit flags are set, do not send the message.
            if self._iopub_msgs_exceeded or self._iopub_data_exceeded:
                return
        super(ZMQChannelsHandler, self)._on_zmq_reply(stream, msg)

    def close(self):
        super(ZMQChannelsHandler, self).close()
        return self._close_future

    def on_close(self):
        self.log.debug("Websocket closed %s", self.session_key)
        # unregister myself as an open session (only if it's really me)
        if self._open_sessions.get(self.session_key) is self:
            self._open_sessions.pop(self.session_key)
        km = self.kernel_manager
        if self.kernel_id in km:
            km.remove_restart_callback(
                self.kernel_id, self.on_kernel_restarted,
            )
            km.remove_restart_callback(
                self.kernel_id, self.on_restart_failed, 'dead',
            )
        # This method can be called twice, once by self.kernel_died and once
        # from the WebSocket close event. If the WebSocket connection is
        # closed before the ZMQ streams are setup, they could be None.
        for channel, stream in self.channels.items():
            if stream is not None and not stream.closed():
                stream.on_recv(None)
                # close the socket directly, don't wait for the stream
                socket = stream.socket
                stream.close()
                socket.close()
        
        self.channels = {}
        self._close_future.set_result(None)

    def _send_status_message(self, status):
        msg = self.session.msg("status",
            {'execution_state': status}
        )
        msg['channel'] = 'iopub'
        self.write_message(json.dumps(msg, default=date_default))

    def on_kernel_restarted(self):
        logging.warn("kernel %s restarted", self.kernel_id)
        self._send_status_message('restarting')

    def on_restart_failed(self):
        logging.error("kernel %s restarted failed!", self.kernel_id)
        self._send_status_message('dead')


#-----------------------------------------------------------------------------
# URL to handler mappings
#-----------------------------------------------------------------------------


_kernel_id_regex = r"(?P<kernel_id>\w+-\w+-\w+-\w+-\w+)"
_kernel_action_regex = r"(?P<action>restart|interrupt)"

default_handlers = [
    (r"/api/kernels", MainKernelHandler),
    (r"/api/kernels/%s" % _kernel_id_regex, KernelHandler),
    (r"/api/kernels/%s/%s" % (_kernel_id_regex, _kernel_action_regex), KernelActionHandler),
    (r"/api/kernels/%s/channels" % _kernel_id_regex, ZMQChannelsHandler),
]
