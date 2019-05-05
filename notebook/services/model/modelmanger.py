import uuid

from tornado import gen
from traitlets import Type
from traitlets.config import LoggingConfigurable

from notebook.services.model.hardcodemodel import HardCodeModel


class ModelManager(LoggingConfigurable):
    default_model_class_name = Type(default_value=HardCodeModel, config=True,
        help=""" the name of the model"""
    )
    _models = {}

    def get_model(self, model_id):
        if model_id in self._models:
            return self._models[model_id]
        return None

    def create_model(self, model_id=None, model_class_name=None, **args):
        if model_id is not None and self.get_model(model_id):
            self.log.info("model already exists `%s`", model_id)
            return self.get_model(model_id)
        if model_id is None:
            model_id = uuid.uuid4()
        if model_class_name is not None:
                self._models[model_id] = model_class_name(args)
        self._models[model_id] = self.default_model_class_name(args)
        return self._models[model_id]

    def load_model(self, model_id=None):
        if self.get_model(model_id) is None:
            return None
        else:
            return self.get_model(model_id).load_model()




    def is_loaded(self, model_id):
        model = self.get_model(model_id)
        if model is not None and model.is_loaded():
            return True
        return False

