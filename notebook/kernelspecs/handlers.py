from tornado import web
from ..base.handlers import IPythonHandler
from ..services.kernelspecs.handlers import kernel_name_regex

class KernelSpecResourceHandler(web.StaticFileHandler, IPythonHandler):
    SUPPORTED_METHODS = ('GET', 'HEAD')

    def initialize(self):
        web.StaticFileHandler.initialize(self, path='')

    @web.authenticated
    def get(self, kernel_name, path, include_body=True):
        kf = self.kernel_finder
        # TODO: Do we actually want all kernel type names to be case-insensitive?
        kernel_name = kernel_name.lower()
        for name, info in kf.find_kernels():
            if name == kernel_name:
                self.root = info['resource_dir']
                self.log.debug("Serving kernel resource from: %s", self.root)
                return web.StaticFileHandler.get(self, path,
                                                 include_body=include_body)

        raise web.HTTPError(404, u'Kernel spec %s not found' % kernel_name)


    @web.authenticated
    def head(self, kernel_name, path):
        return self.get(kernel_name, path, include_body=False)

default_handlers = [
    (r"/kernelspecs/%s/(?P<path>.*)" % kernel_name_regex, KernelSpecResourceHandler),
]
