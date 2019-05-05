import json

from tornado import gen
from tornado.httpclient import HTTPRequest, AsyncHTTPClient
from notebook.services.model.base import Session


class HttpSession(Session):

    def __init__(self, ip=None, port=None, **kwargs):

            self.ip = ip or "localhost"
            self.port = port or "8000"
            # fixme: async http client is need
            self.http_client = AsyncHTTPClient()
            super(HttpSession, self).__init__(**kwargs)

    async def do_request(self, question_number, content):
        msg = self.make_message(question_number, content)
        infer_result = await self.do_post(msg)
        return infer_result

    @gen.coroutine
    def do_post(self, msg):
        url = "http://%s:%s/infer" % (self.ip, self.port)
        body = json.dumps(msg)
        req = HTTPRequest(url=url,
                          method="POST",
                          headers={"Accept": "application/json"},
                          body=body
                          )

        respone = yield self.http_client.fetch(request=req)
        #respone_json = json.loads(respone.body.decode('utf8', 'replace'))
        respone_json = json.loads(respone.body)

        return respone_json['infer_result']
