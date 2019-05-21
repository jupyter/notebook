"""Base Tornado handlers for the notebook server."""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from jupyter_server.extension.handler import ExtensionHandler

class BaseHandler(ExtensionHandler):
    
    extension_name = "notebook"
    
    @property
    def jinja_template_vars(self):
        """User-supplied values to supply to jinja templates."""
        key = '{extension_name}_jinja_template_vars'.format(extension_name=self.extension_name)
        return self.settings.get(key, {})
    
    def get_template(self, name):
        """Return the jinja template object for a given name"""
        key = '{extension_name}_jinja2_env'.format(extension_name=self.extension_name)
        return self.settings[key].get_template(name)
