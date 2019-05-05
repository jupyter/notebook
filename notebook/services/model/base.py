import json

from tornado import gen
from traitlets.config import LoggingConfigurable

class Session(LoggingConfigurable):

    def make_message(self,question_number,content):
        msg = dict(
            question_number=question_number,
            content=content
        )
        return msg

    # fixme: maybe we need some of serializer in the future
    def serialize(self, msg):
        return json.dumps(msg)

    def do_request(self,question_number, content):
        pass

    def deserialize(self, msg):
        return json.loads(msg)










class Model(LoggingConfigurable):
    """
    """
    _model = None


    def infer(self, question_number, content):
        pass

    def load_model(self):
        pass
    def is_loaded(self):
        return self._model is not None


