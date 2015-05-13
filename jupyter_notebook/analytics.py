from datetime import datetime, timedelta
import errno
import json
import os
import os.path as osp
import sys

from jupyter_client.jsonutil import parse_date
from tornado.httpclient import AsyncHTTPClient
from tornado.ioloop import IOLoop
from tornado import web
import zmq
from zmq.eventloop.zmqstream import ZMQStream

from .base.handlers import IPythonHandler, json_errors
from .utils import url_path_join as ujoin
from ._version import __version__

CONSENT_UNKNOWN = 0
CONSENT_OK = 1
CONSENT_DENIED = 2

class AnalyticsSender(object):
    _control_info = None
    socket = None
    enabled = False

    def __init__(self, nbapp):
        self.nbapp = nbapp
        self.directory = osp.join(nbapp.data_dir, 'analytics')
        self.control_file = osp.join(self.directory, 'control.json')
        self.data_file = osp.join(nbapp.data_dir, 'analytics', 'data.json')
        self.data = {}
        self.ioloop = IOLoop.current()

    def control_info(self):
        if self._control_info is None:
            try:
                with open(self.control_file, 'r') as f:
                    self._control_info = json.load(f)
            except IOError as e:
                if e.errno == errno.ENOENT:
                    self._control_info = {}
                else:
                    raise

        return self._control_info

    def store_control_info(self):
        assert self._control_info is not None
        try:
            os.makedirs(self.directory)
        except OSError as e:
            if e.errno != errno.EEXIST:
                raise

        with open(self.control_file, 'w') as f:
            json.dump(self._control_info, f)

    def read_data(self):
        try:
            with open(self.data_file, 'r') as f:
                self.data = json.load(f)
        except OSError as e:
            if e.errno != errno.ENOENT:
                raise

    def store_data(self):
        try:
            os.makedirs(self.directory)
        except OSError as e:
            if e.errno != errno.EEXIST:
                raise

        with open(self.data_file, 'w') as f:
            json.dump(self.data, f)

    def consent_status(self):
        ci = self.control_info()
        if 'consent' in ci:
            return CONSENT_OK if ci['consent'] else CONSENT_DENIED
        return CONSENT_UNKNOWN

    def change_consent_status(self, status):
        ci = self.control_info()
        if status == CONSENT_OK:
            if not ci.get('consent', False):
                self.enable()
            ci['consent'] = True
        elif status == CONSENT_DENIED:
            ci['consent'] = False
        else:
            ci.pop('consent', None)

        self.store_control_info()

    def last_submission(self):
        ci = self.control_info()
        if 'last_submission' in ci:
            return parse_date(ci['last_submission'])

        return None

    def startup(self):
        webapp = self.nbapp.web_app

        consent = self.consent_status()
        if consent == CONSENT_OK:
            self.enable()
        elif consent == CONSENT_UNKNOWN:
            webapp.settings['analytics_prompt'] = True

        base_url = webapp.settings['base_url']
        webapp.add_handlers(".*$", [
            (ujoin(base_url, r"/analytics/consent"), ConsentHandler,
                {'sender': self}),
        ])

    def enable(self):
        self.enabled = True
        self.nbapp.log.info("Enabling analytics")
        self.read_data()
        self.record_version('jupyter_notebook', __version__)
        self.record_version('server_python', sys.version)
        self.schedule_send()

        self.socket = zmq.Context.instance().socket(zmq.PULL)
        port = self.socket.bind_to_random_port('tcp://127.0.0.1')
        self.nbapp.kernel_manager.analytics_port = port
        self.stream = ZMQStream(self.socket)
        self.stream.on_recv(self.on_recv)

    def on_recv(self, msg_parts):
        data = json.loads(msg_parts[0])
        msg_type = data['msg_type']
        if msg_type == 'version':
            self.record_version(data['project'], data['version'])
        elif msg_type == 'feature':
            self.record_feature(data['project'], data['feature'])

    def schedule_send(self):
        last = self.last_submission()
        if last is None:
            self.ioloop.add_callback(self.send)
            return

        since_last = datetime.utcnow() - last
        if since_last > timedelta(days=28):
            self.ioloop.add_callback(self.send)
        else:
            to_next = (last + timedelta(days=28)) - datetime.utcnow()
            self.ioloop.call_later(to_next.total_seconds(), self.send)

    def send(self):
        http_client = AsyncHTTPClient()
        # http_client.fetch('https://...', method='POST',
        #                   body=json.dumps(self.data))
        self.control_info()['last_submission'] = datetime.utcnow().isoformat()
        self.store_control_info()

        # Reset the data for the next month's collection
        self.data = {}
        self.record_version('jupyter_notebook', __version__)
        self.record_version('server_python', sys.version)
        self.ioloop.call_later(timedelta(days=28).total_seconds(), self.send)

    def record_version(self, project, version):
        proj_data = self.data.setdefault(project, {})
        versions = set(proj_data.get('versions', []))
        if version not in versions:
            versions.add(version)
            proj_data['versions'] = list(version)
            self.store_data()

    def record_feature(self, project, feature):
        proj_data = self.data.setdefault(project, {})
        features = set(proj_data.get('features', []))
        if feature not in features:
            features.add(feature)
            proj_data['features'] = list(features)
            self.store_data()

class ConsentHandler(IPythonHandler):
    def initialize(self, sender):
        self.sender = sender

    @web.authenticated
    @json_errors
    def post(self):
        data = self.get_json_body()
        if data['status']:
            self.sender.change_consent_status(CONSENT_OK)
        else:
            self.sender.change_consent_status(CONSENT_DENIED)
