"""Tornado handlers for kernels.

Preliminary documentation at https://github.com/ipython/ipython/wiki/IPEP-16%3A-Notebook-multi-directory-dashboard-and-URL-mapping#kernels-api
"""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import json
import logging
from textwrap import dedent

from tornado import gen, web
from tornado.concurrent import Future
from tornado.ioloop import IOLoop

from jupyter_client.jsonutil import date_default
from jupyter_protocol.messages import Message
from ipython_genutils.py3compat import cast_unicode
from notebook.utils import url_path_join, url_escape

from ...base.handlers import APIHandler
from ...base.zmqhandlers import AuthenticatedZMQStreamHandler, deserialize_binary_message


class MainKernelHandler(APIHandler):

    @web.authenticated
    @gen.coroutine
    def get(self):
        km = self.kernel_manager
        kernels = yield gen.maybe_future(km.list_kernels())
        self.finish(json.dumps(kernels, default=date_default))

    @web.authenticated
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
        self.finish(json.dumps(model, default=date_default))


class KernelHandler(APIHandler):

    @web.authenticated
    def get(self, kernel_id):
        km = self.kernel_manager
        km._check_kernel_id(kernel_id)
        model = km.kernel_model(kernel_id)
        self.finish(json.dumps(model, default=date_default))

    @web.authenticated
    @gen.coroutine
    def delete(self, kernel_id):
        km = self.kernel_manager
        yield gen.maybe_future(km.shutdown_kernel(kernel_id))
        self.set_status(204)
        self.finish()


class KernelActionHandler(APIHandler):

    @web.authenticated
    @gen.coroutine
    def post(self, kernel_id, action):
        km = self.kernel_manager
        if action == 'interrupt':
            km.get_kernel(kernel_id).interrupt()
            self.set_status(204)
        if action == 'restart':

            try:
                yield gen.maybe_future(km.restart_kernel(kernel_id))
            except Exception as e:
                self.log.error("Exception restarting kernel", exc_info=True)
                self.set_status(500)
            else:
                model = km.kernel_model(kernel_id)
                self.write(json.dumps(model, default=date_default))
        self.finish()


class ZMQChannelsHandler(AuthenticatedZMQStreamHandler):
    '''There is one ZMQChannelsHandler per running kernel and it oversees all
    the sessions.
    '''
    
    # class-level registry of open sessions
    # allows checking for conflict on session-id,
    # which is used as a zmq identity and must be unique.
    _open_sessions = {}

    @property
    def kernel_info_timeout(self):
        km_default = self.kernel_manager.kernel_info_timeout
        return self.settings.get('kernel_info_timeout', km_default)

    @property
    def iopub_msg_rate_limit(self):
        return self.settings.get('iopub_msg_rate_limit', 0)

    @property
    def iopub_data_rate_limit(self):
        return self.settings.get('iopub_data_rate_limit', 0)

    @property
    def rate_limit_window(self):
        return self.settings.get('rate_limit_window', 1.0)

    @property
    def kernel_client(self):
        return self.kernel_manager.get_kernel(self.kernel_id).client

    def __repr__(self):
        return "%s(%s)" % (self.__class__.__name__, getattr(self, 'kernel_id', 'uninitialized'))

    channels = {'shell', 'iopub', 'stdin'}

    def initialize(self):
        super(ZMQChannelsHandler, self).initialize()
        self.zmq_stream = None
        self.kernel_id = None
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
        self.session_key = '%s:%s' % (self.kernel_id, self.session_id)
        stale_handler = self._open_sessions.get(self.session_key)
        if stale_handler:
            self.log.warning("Replacing stale connection: %s", self.session_key)
            yield stale_handler.close()
        self._open_sessions[self.session_key] = self

    def open(self, kernel_id):
        super(ZMQChannelsHandler, self).open()
        km = self.kernel_manager
        km.notify_connect(kernel_id)
        kernel = km.get_kernel(kernel_id)

        # on new connections, flush the message buffer
        buffer_key, replay_buffer = kernel.get_buffer()
        if buffer_key == self.session_key:
            self.log.info("Restoring connection for %s", self.session_key)
            if replay_buffer:
                self.log.info("Replaying %s buffered messages", len(replay_buffer))
                for msg, channel in replay_buffer:
                    self._on_zmq_msg(msg, channel)

        # km.add_restart_callback(self.kernel_id, self.on_kernel_restarted)
        # km.add_restart_callback(self.kernel_id, self.on_restart_failed, 'dead')

        kernel.client.add_handler(self._on_zmq_msg, self.channels)

    def on_message(self, msg):
        """Received websocket message; forward to kernel"""
        if self._close_future.done():
            # already closed, ignore the message
            self.log.debug("Received message on closed websocket %r", msg)
            return
        if isinstance(msg, bytes):
            msg = deserialize_binary_message(msg)
        else:
            msg = json.loads(msg)
        channel = msg.pop('channel', None)
        if channel is None:
            self.log.warning("No channel specified, assuming shell: %s", msg)
            channel = 'shell'
        if channel not in self.channels:
            self.log.warning("No such channel: %r", channel)
            return
        self.kernel_client.messaging.send(channel, Message(**msg))

    def _on_zmq_msg(self, msg: Message, channel):
        """Received message from kernel; forward over websocket"""
        def write_stderr(error_message):
            self.log.warning(error_message)
            stream_msg = Message.from_type("stream",
                content={"text": error_message + '\n', "name": "stderr"},
            ).make_dict()
            stream_msg['parent_header'] = msg.parent_header
            stream_msg['channel'] = 'iopub'
            self.write_message(json.dumps(stream_msg, default=date_default))

        msg_type = msg.header['msg_type']

        if channel == 'iopub' and msg_type == 'status' and msg.content.get('execution_state') == 'idle':
            # reset rate limit counter on status=idle,
            # to avoid 'Run All' hitting limits prematurely.
            self._iopub_window_byte_queue = []
            self._iopub_window_msg_count = 0
            self._iopub_window_byte_count = 0
            self._iopub_msgs_exceeded = False
            self._iopub_data_exceeded = False

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
            if msg_type == 'stream':
                byte_count = len(msg.content['text'].encode('utf-8'))
            else:
                byte_count = 0
            self._iopub_window_byte_count += byte_count
            
            # Queue a removal of the byte and message count for a time in the 
            # future, when we are no longer interested in it.
            self._iopub_window_byte_queue.append((now + self.rate_limit_window, byte_count))
            
            # Check the limits, set the limit flags, and reset the
            # message and data counts.
            msg_rate = float(self._iopub_window_msg_count) / self.rate_limit_window
            data_rate = float(self._iopub_window_byte_count) / self.rate_limit_window
            
            # Check the msg rate
            if self.iopub_msg_rate_limit > 0 and msg_rate > self.iopub_msg_rate_limit:
                if not self._iopub_msgs_exceeded:
                    self._iopub_msgs_exceeded = True
                    write_stderr(dedent("""\
                    IOPub message rate exceeded.
                    The notebook server will temporarily stop sending output
                    to the client in order to avoid crashing it.
                    To change this limit, set the config variable
                    `--NotebookApp.iopub_msg_rate_limit`.
                    
                    Current values:
                    NotebookApp.iopub_msg_rate_limit={} (msgs/sec)
                    NotebookApp.rate_limit_window={} (secs)
                    """.format(self.iopub_msg_rate_limit, self.rate_limit_window)))
            else:
                # resume once we've got some headroom below the limit
                if self._iopub_msgs_exceeded and msg_rate < (0.8 * self.iopub_msg_rate_limit):
                    self._iopub_msgs_exceeded = False
                    if not self._iopub_data_exceeded:
                        self.log.warning("iopub messages resumed")

            # Check the data rate
            if self.iopub_data_rate_limit > 0 and data_rate > self.iopub_data_rate_limit:
                if not self._iopub_data_exceeded:
                    self._iopub_data_exceeded = True
                    write_stderr(dedent("""\
                    IOPub data rate exceeded.
                    The notebook server will temporarily stop sending output
                    to the client in order to avoid crashing it.
                    To change this limit, set the config variable
                    `--NotebookApp.iopub_data_rate_limit`.
                    
                    Current values:
                    NotebookApp.iopub_data_rate_limit={} (bytes/sec)
                    NotebookApp.rate_limit_window={} (secs)
                    """.format(self.iopub_data_rate_limit, self.rate_limit_window)))
            else:
                # resume once we've got some headroom below the limit
                if self._iopub_data_exceeded and data_rate < (0.8 * self.iopub_data_rate_limit):
                    self._iopub_data_exceeded = False
                    if not self._iopub_msgs_exceeded:
                        self.log.warning("iopub messages resumed")
        
            # If either of the limit flags are set, do not send the message.
            if self._iopub_msgs_exceeded or self._iopub_data_exceeded:
                # we didn't send it, remove the current message from the calculus
                self._iopub_window_msg_count -= 1
                self._iopub_window_byte_count -= byte_count
                self._iopub_window_byte_queue.pop(-1)
                return
        super(ZMQChannelsHandler, self)._on_zmq_msg(msg, channel)

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
            km.notify_disconnect(self.kernel_id)
            # km.remove_restart_callback(
            #     self.kernel_id, self.on_kernel_restarted,
            # )
            # km.remove_restart_callback(
            #     self.kernel_id, self.on_restart_failed, 'dead',
            # )

            # start buffering instead of closing if this was the last connection
            kernel = km.get_kernel(self.kernel_id)
            if kernel.n_connections == 0:
                km.start_buffering(self.kernel_id, self.session_key, self.channels)

            kernel.client.remove_handler(self._on_zmq_msg)

        self._close_future.set_result(None)

    def _send_status_message(self, status):
        iopub = self.channels.get('iopub', None)
        if iopub and not iopub.closed():
            # flush IOPub before sending a restarting/dead status message
            # ensures proper ordering on the IOPub channel
            # that all messages from the stopped kernel have been delivered
            iopub.flush()
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
