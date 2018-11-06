"""Test serialize/deserialize messages with buffers"""

import os

import nose.tools as nt

from jupyter_protocol.messages import Message
from notebook.services.kernels.ws_serialize import (
    serialize_message, deserialize_message
)

def test_serialize_json():
    msg = Message.from_type('data_pub', content={'a': 'b'})
    smsg = serialize_message(msg, 'iopub')
    nt.assert_is_instance(smsg, str)

def test_serialize_binary():
    msg = Message.from_type('data_pub', content={'a': 'b'})
    msg.buffers = [memoryview(os.urandom(3)) for i in range(3)]
    bmsg = serialize_message(msg, 'iopub')
    nt.assert_is_instance(bmsg, bytes)

def test_deserialize_json():
    msg = Message.from_type('data_pub', content={'a': 'b'})
    smsg = serialize_message(msg, 'iopub')
    print("Serialised: ", smsg)
    msg_dict = msg.make_dict()
    msg_dict['channel'] = 'iopub'
    msg_dict['buffers'] = []

    msg2 = deserialize_message(smsg)
    nt.assert_equal(msg2, msg_dict)

def test_deserialize_binary():
    msg = Message.from_type('data_pub', content={'a': 'b'})
    msg.buffers = [memoryview(os.urandom(3)) for i in range(3)]
    bmsg = serialize_message(msg, 'iopub')
    msg_dict = msg.make_dict()
    msg_dict['channel'] = 'iopub'
    msg_dict['buffers'] = msg.buffers

    msg2 = deserialize_message(bmsg)
    nt.assert_equal(msg2, msg_dict)
