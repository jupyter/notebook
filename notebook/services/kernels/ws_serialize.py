"""Serialize & deserialize Jupyter messages to send over websockets.
"""
# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from datetime import datetime, timezone
import json
import struct
import sys

from dateutil.tz import tzutc

from ipython_genutils.py3compat import cast_unicode
from jupyter_client.jsonutil import date_default, extract_dates

def serialize_message(msg, channel):
    """Serialize a message from the kernel, using JSON.

    msg is a jupyter_protocol Message object

    Returns a str of JSON if there are no binary buffers, or bytes which may
    be sent as a binary websocket message.
    """
    d = msg.make_dict()
    if channel:
        d['channel'] = channel
    if msg.buffers:
        buf = serialize_binary_message(d, msg.buffers)
        return buf
    else:
        smsg = json.dumps(d, default=date_default)
        return cast_unicode(smsg)

def serialize_binary_message(msg_dict, buffers):
    """serialize a message as a binary blob

    Header:

    4 bytes: number of msg parts (nbufs) as 32b int
    4 * nbufs bytes: offset for each buffer as integer as 32b int

    Offsets are from the start of the buffer, including the header.

    Returns
    -------

    The message serialized to bytes.

    """
    # don't modify msg or buffer list in-place
    msg_dict = msg_dict.copy()
    buffers = list(buffers)

    if sys.version_info < (3, 4):
        buffers = [x.tobytes() for x in buffers]
    bmsg = json.dumps(msg_dict, default=date_default).encode('utf8')
    buffers.insert(0, bmsg)
    nbufs = len(buffers)
    offsets = [4 * (nbufs + 1)]
    for buf in buffers[:-1]:
        offsets.append(offsets[-1] + len(buf))
    offsets_buf = struct.pack('!' + 'I' * (nbufs + 1), nbufs, *offsets)
    buffers.insert(0, offsets_buf)
    return b''.join(buffers)

def deserialize_message(msg):
    """Deserialize a websocket message, return a dict.

    msg may be either bytes, for a binary websocket message including buffers,
    or str, for a pure JSON message.
    """
    if isinstance(msg, bytes):
        msg = deserialize_binary_message(msg)
    else:
        msg = json.loads(msg)

    msg['header'] = convert_tz_utc(extract_dates(msg['header']))
    msg['parent_header'] = convert_tz_utc(extract_dates(msg['parent_header']))
    return msg

def deserialize_binary_message(bmsg):
    """deserialize a message from a binary blob

    Header:

    4 bytes: number of msg parts (nbufs) as 32b int
    4 * nbufs bytes: offset for each buffer as integer as 32b int

    Offsets are from the start of the buffer, including the header.

    Returns
    -------

    message dictionary
    """
    nbufs = struct.unpack('!i', bmsg[:4])[0]
    offsets = list(struct.unpack('!' + 'I' * nbufs, bmsg[4:4*(nbufs+1)]))
    offsets.append(None)
    bufs = []
    for start, stop in zip(offsets[:-1], offsets[1:]):
        bufs.append(bmsg[start:stop])
    msg = json.loads(bufs[0].decode('utf8'))

    msg['buffers'] = bufs[1:]
    return msg

def convert_tz_utc(obj):
    """Replace dateutil tzutc objects with stdlib datetime utc objects"""
    if isinstance(obj, dict):
        new_obj = {} # don't clobber
        for k,v in obj.items():
            new_obj[k] = convert_tz_utc(v)
        obj = new_obj
    elif isinstance(obj, (list, tuple)):
        obj = [ convert_tz_utc(o) for o in obj ]
    elif isinstance(obj, datetime) and isinstance(obj.tzinfo, tzutc):
        obj = obj.replace(tzinfo=timezone.utc)
    return obj
