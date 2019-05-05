import subprocess

from tornado import gen

from notebook.services.model.httpsession import HttpSession
from .base import Model
from notebook.utils import maybe_future


class HardCodeModel(Model):

    def __init__(self, model_id = None, ip=None, port=None, **kwargs):
        self.ip = ip or "localhost"
        self.port = port or "8000"
        self.model_id = model_id
        # self._loaded = False
        # fixme: maybe we need to suport more protocols in the future, such as grpc, https, zmq etc.
        self.session = HttpSession(ip=self.ip, port=self.port)
        super(HardCodeModel, self).__init__()


    async def infer(self, question_number, content):
        return await self.session.do_request(question_number, content)

    def load_model(self):
        if self._model is not None:
            return self.model_id
        model_cmd = ['python', 'hardcode.py', '-ip', self.ip, '-port', self.port]
        self.launch_model(model_cmd)
        return self.model_id

    def launch_model(self, model_cmd):
        try:
            self._model = subprocess.Popen(model_cmd)
        except Exception as exc:
            self.log.error("failed to launch_model `HardCodeModel`")
        return self._model

    def get_model_id(self):
        return self.model_id

    def is_loaded(self):
        return self._model is not None

