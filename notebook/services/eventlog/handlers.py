import json

from tornado import web

from notebook.utils import url_path_join
from notebook.base.handlers import APIHandler, json_errors
from jupyter_telemetry.eventlog import EventLog


class EventLoggingHandler(APIHandler):
    """
    A handler that receives and stores telemetry data from the client.
    """
    @json_errors
    @web.authenticated
    def post(self, *args, **kwargs):
        try:
            # Parse the data from the request body
            raw_event = json.loads(self.request.body.strip().decode())
        except Exception as e:
            raise web.HTTPError(400, str(e))
        
        required_fields = {'schema', 'version', 'event'}
        for rf in required_fields:
            if rf not in raw_event:
                raise web.HTTPError(400, f'{rf} is a required field')

        schema_name = raw_event['schema'] 
        version = raw_event['version']
        event = raw_event['event']
        
        # Profile, and move to a background thread if this is problematic
        # FIXME: Return a more appropriate error response if validation fails
        self.eventlog.record_event(schema_name, version, event)

        self.set_status(204)
        self.finish()


default_handlers = [
    (r"/api/eventlog", EventLoggingHandler),
]