"""
a demo which hard code the inference result
"""
import json

import tornado.ioloop
import tornado.web
from traitlets import Integer
from traitlets.config import SingletonConfigurable, Unicode


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello, world")

    def post(self):
        json_string = self.request.body.decode('utf8')
        try:
            req = json.loads(json_string)
        except:
            self.set_status(400)
            self.finish()
        res = dict(
            infer_result="Please consider some transcendental numbers, such as pi,e"
        )
        self.set_status(201)
        self.set_header("Content-Type", "text/json")
        self.finish(json.dumps(res))





class demo(SingletonConfigurable):
    port = Integer(
        default_value=8000,
        config=True,
        help="the port which the server will listen"
    )
    ip = Unicode(
        default_value="localhost",
        config=True,
        help="the port which the server will listen"
    )
    def make_app(self):
        return tornado.web.Application([
            (r"/infer", MainHandler),
        ])
    def start(self):
        app = self.make_app()
        self.log.info("port: %s", self.port)
        app.listen(self.port)
        tornado.ioloop.IOLoop.current().start()


if __name__ == "__main__":
    d = demo.instance()
    d.start()
