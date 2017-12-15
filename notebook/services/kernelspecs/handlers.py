"""Tornado handlers for kernel specifications.

Preliminary documentation at https://github.com/ipython/ipython/wiki/IPEP-25%3A-Registry-of-installed-kernels#rest-api
"""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import glob
import json
import os
pjoin = os.path.join

from tornado import web

from ...base.handlers import APIHandler
from ...utils import url_path_join, url_unescape

def kernelspec_model(handler, name, spec_dict, resource_dir):
    """Load a KernelSpec by name and return the REST API model"""
    d = {
        'name': name,
        'spec': spec_dict,
        'resources': {}
    }

    # Add resource files if they exist
    resource_dir = resource_dir
    for resource in ['kernel.js', 'kernel.css']:
        if os.path.exists(pjoin(resource_dir, resource)):
            d['resources'][resource] = url_path_join(
                handler.base_url,
                'kernelspecs',
                name,
                resource
            )
    for logo_file in glob.glob(pjoin(resource_dir, 'logo-*')):
        fname = os.path.basename(logo_file)
        no_ext, _ = os.path.splitext(fname)
        d['resources'][no_ext] = url_path_join(
            handler.base_url,
            'kernelspecs',
            name,
            fname
        )
    return d

class MainKernelSpecHandler(APIHandler):

    @web.authenticated
    def get(self):
        ksm = self.kernel_spec_manager
        km = self.kernel_manager
        model = {}
        model['default'] = km.default_kernel_name
        model['kernelspecs'] = specs = {}
        for kernel_name, kernel_info in ksm.get_all_specs().items():
            try:
                d = kernelspec_model(self, kernel_name, kernel_info['spec'],
                                     kernel_info['resource_dir'])
            except Exception:
                self.log.error("Failed to load kernel spec: '%s'", kernel_name, exc_info=True)
                continue
            specs[kernel_name] = d
        self.set_header("Content-Type", 'application/json')
        self.finish(json.dumps(model))


class KernelSpecHandler(APIHandler):

    @web.authenticated
    def get(self, kernel_name):
        ksm = self.kernel_spec_manager
        kernel_name = url_unescape(kernel_name)
        try:
            spec = ksm.get_kernel_spec(kernel_name)
        except KeyError:
            raise web.HTTPError(404, u'Kernel spec %s not found' % kernel_name)
        model = kernelspec_model(self, kernel_name, spec.to_dict(), spec.resource_dir)
        self.set_header("Content-Type", 'application/json')
        self.finish(json.dumps(model))


# URL to handler mappings

kernel_name_regex = r"(?P<kernel_name>[\w\.\-%]+)"

default_handlers = [
    (r"/api/kernelspecs", MainKernelSpecHandler),
    (r"/api/kernelspecs/%s" % kernel_name_regex, KernelSpecHandler),
]
