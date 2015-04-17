import os
from IPython.html.utils import url_path_join as ujoin
from tornado.web import StaticFileHandler

module_path = os.path.dirname(__file__)
def load_jupyter_server_extension(nbapp):
    webapp = nbapp.web_app
    base_url = webapp.settings['base_url']
    webapp.add_handlers(".*$", [
        (ujoin(base_url, r"/widgets/static/(.+)"), StaticFileHandler, 
            {'path': os.path.join(module_path, 'static')}),
    ])
