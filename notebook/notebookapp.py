# coding: utf-8
"""A tornado based Jupyter notebook server."""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from __future__ import absolute_import, print_function
from nbformat.sign import NotebookNotary
from .serverapp import *

#-----------------------------------------------------------------------------
# Module globals
#-----------------------------------------------------------------------------

_examples = """
jupyter notebook                       # start the notebook
jupyter notebook --certfile=mycert.pem # use SSL/TLS certificate
"""

DEV_NOTE_NPM = """It looks like you're running the notebook from source.
If you're working on the Javascript of the notebook, try running

    npm run build:watch

in another terminal window to have the system incrementally
watch and build the notebook's JavaScript for you, as you make changes.
"""

#-----------------------------------------------------------------------------
# The Tornado web application
#-----------------------------------------------------------------------------

class NotebookWebApplication(JupyterWebApplication):

    def __init__(self, jupyter_app, kernel_manager, contents_manager,
                 session_manager, kernel_spec_manager,
                 config_manager, log,
                 base_url, default_url, settings_overrides, jinja_env_options):

        # If the user is running the notebook in a git directory, make the assumption
        # that this is a dev install and suggest to the developer `npm run build:watch`.
        base_dir = os.path.realpath(os.path.join(__file__, '..', '..'))
        dev_mode = os.path.exists(os.path.join(base_dir, '.git'))
        if dev_mode:
            log.info(DEV_NOTE_NPM)

        settings = self.init_settings(
            jupyter_app, kernel_manager, contents_manager,
            session_manager, kernel_spec_manager, config_manager, log, base_url,
            default_url, settings_overrides, jinja_env_options)
        handlers = self.init_handlers(settings)
        super(JupyterWebApplication, self).__init__(handlers, **settings)

    def init_settings(self, jupyter_app, kernel_manager, contents_manager,
                      session_manager, kernel_spec_manager,
                      config_manager,
                      log, base_url, default_url, settings_overrides,
                      jinja_env_options=None):
        settings = super(NotebookWebApplication, self).init_settings(jupyter_app, kernel_manager, contents_manager,
                      session_manager, kernel_spec_manager,
                      config_manager,
                      log, base_url, default_url, settings_overrides,
                      jinja_env_options=None)

        if jupyter_app.ignore_minified_js:
            log.warn("""The `ignore_minified_js` flag is deprecated and no
                longer works.  Alternatively use `npm run build:watch` when
                working on the notebook's Javascript and LESS""")
            warnings.warn("The `ignore_minified_js` flag is deprecated and will be removed in Notebook 6.0", DeprecationWarning)

        settings['nbextensions_path'] = jupyter_app.nbextensions_path
        settings['ignore_minified_js'] = jupyter_app.ignore_minified_js
        return settings

    def init_handlers(self, settings):
        """Load the (URL pattern, handler) tuples for each component."""
        # Order matters. The first handler to match the URL will handle the request.
        handlers = []
        handlers.extend(load_handlers('tree.handlers'))
        handlers.extend([(r"/login", settings['login_handler_class'])])
        handlers.extend([(r"/logout", settings['logout_handler_class'])])
        handlers.extend(load_handlers('files.handlers'))
        handlers.extend(load_handlers('notebook.handlers'))
        handlers.extend(load_handlers('nbconvert.handlers'))
        handlers.extend(load_handlers('bundler.handlers'))
        handlers.extend(load_handlers('kernelspecs.handlers'))
        handlers.extend(load_handlers('edit.handlers'))
        handlers.extend(load_handlers('services.api.handlers'))
        handlers.extend(load_handlers('services.config.handlers'))
        handlers.extend(load_handlers('services.kernels.handlers'))
        handlers.extend(load_handlers('services.contents.handlers'))
        handlers.extend(load_handlers('services.sessions.handlers'))
        handlers.extend(load_handlers('services.nbconvert.handlers'))
        handlers.extend(load_handlers('services.kernelspecs.handlers'))
        handlers.extend(load_handlers('services.security.handlers'))
        
        # BEGIN HARDCODED WIDGETS HACK
        # TODO: Remove on notebook 5.0
        widgets = None
        try:
            import widgetsnbextension
        except:
            try:
                import ipywidgets as widgets
                handlers.append(
                    (r"/nbextensions/widgets/(.*)", FileFindHandler, {
                        'path': widgets.find_static_assets(),
                        'no_cache_paths': ['/'], # don't cache anything in nbextensions
                    }),
                )
            except:
                app_log.warning('Widgets are unavailable. Please install widgetsnbextension or ipywidgets 4.0')
        # END HARDCODED WIDGETS HACK
        
        handlers.append(
            (r"/nbextensions/(.*)", FileFindHandler, {
                'path': settings['nbextensions_path'],
                'no_cache_paths': ['/'], # don't cache anything in nbextensions
            }),
        )
        print(settings['static_custom_path'])
        handlers.append(
            (r"/custom/(.*)", FileFindHandler, {
                'path': settings['static_custom_path'],
                'no_cache_paths': ['/'], # don't cache anything in custom
            })
        )
        # register base handlers last
        handlers.extend(load_handlers('base.handlers'))
        # set the URL that will be redirected from `/`
        handlers.append(
            (r'/?', web.RedirectHandler, {
                'url' : settings['default_url'],
                'permanent': False, # want 302, not 301
            })
        )

        # prepend base_url onto the patterns that we match
        new_handlers = []
        for handler in handlers:
            pattern = url_path_join(settings['base_url'], handler[0])
            new_handler = tuple([pattern] + list(handler[1:]))
            new_handlers.append(new_handler)
        # add 404 on the end, which will catch everything that falls through
        new_handlers.append((r'(.*)', Template404))
        return new_handlers


#-----------------------------------------------------------------------------
# Aliases and Flags
#-----------------------------------------------------------------------------

flags['pylab']=(
    {'NotebookApp' : {'pylab' : 'warn'}},
    "DISABLED: use %pylab or %matplotlib in the notebook to enable matplotlib."
)
flags['no-mathjax']=(
    {'NotebookApp' : {'enable_mathjax' : False}},
    """Disable MathJax
    
    MathJax is the javascript library Jupyter uses to render math/LaTeX. It is
    very large, so you may want to disable it if you have a slow internet
    connection, or for offline use of the notebook.
    
    When disabled, equations etc. will appear as their untransformed TeX source.
    """
)

aliases = dict(base_aliases)

aliases.update({
    'notebook-dir': 'NotebookApp.notebook_dir',
    'pylab': 'NotebookApp.pylab',
})

#-----------------------------------------------------------------------------
# NotebookApp
#-----------------------------------------------------------------------------

class NotebookApp(ServerApp):

    name = 'jupyter-notebook'
    description = """
        The Jupyter HTML Notebook.
        
        This launches a Tornado based HTML Notebook Server that serves up an
        HTML5/Javascript Notebook client.
    """
    examples = _examples
    aliases = aliases
    flags = flags
    appclass = NotebookWebApplication
    
    classes = ServerApp.classes + [NotebookNotary]
    flags = Dict(flags)
    aliases = Dict(aliases)
    
    enable_mathjax = Bool(True, config=True,
        help="""Whether to enable MathJax for typesetting math/TeX

        MathJax is the javascript library Jupyter uses to render math/LaTeX. It is
        very large, so you may want to disable it if you have a slow internet
        connection, or for offline use of the notebook.

        When disabled, equations etc. will appear as their untransformed TeX source.
        """
    )

    @observe('enable_mathjax')
    def _update_enable_mathjax(self, change):
        """set mathjax url to empty if mathjax is disabled"""
        if not change['new']:
            self.mathjax_url = u''

    extra_nbextensions_path = List(Unicode(), config=True,
        help="""extra paths to look for Javascript notebook extensions"""
    )
    
    @property
    def nbextensions_path(self):
        """The path to look for Javascript notebook extensions"""
        path = self.extra_nbextensions_path + jupyter_path('nbextensions')
        # FIXME: remove IPython nbextensions path after a migration period
        try:
            from IPython.paths import get_ipython_dir
        except ImportError:
            pass
        else:
            path.append(os.path.join(get_ipython_dir(), 'nbextensions'))
        return path

    ignore_minified_js = Bool(False, config=True,
            help='Deprecated: Use minified JS file or not, mainly use during dev to avoid JS recompilation', 
    )

    mathjax_url = Unicode("", config=True,
        help="""A custom url for MathJax.js.
        Should be in the form of a case-sensitive url to MathJax,
        for example:  /static/components/MathJax/MathJax.js
        """
    )

    @default('mathjax_url')
    def _default_mathjax_url(self):
        if not self.enable_mathjax:
            return u''
        static_url_prefix = self.tornado_settings.get("static_url_prefix", "static")
        return url_path_join(static_url_prefix, 'components', 'MathJax', 'MathJax.js')
    
    @observe('mathjax_url')
    def _update_mathjax_url(self, change):
        new = change['new']
        if new and not self.enable_mathjax:
            # enable_mathjax=False overrides mathjax_url
            self.mathjax_url = u''
        else:
            self.log.info("Using MathJax: %s", new)

    mathjax_config = Unicode("TeX-AMS-MML_HTMLorMML-full,Safe", config=True,
        help="""The MathJax.js configuration file that is to be used."""
    )

    @observe('mathjax_config')
    def _update_mathjax_config(self, change):
        self.log.info("Using MathJax configuration file: %s", change['new'])

    pylab = Unicode('disabled', config=True,
        help="""
        DISABLED: use %pylab or %matplotlib in the notebook to enable matplotlib.
        """
    )

    @observe('pylab')
    def _update_pylab(self, change):
        """when --pylab is specified, display a warning and exit"""
        if change['new'] != 'warn':
            backend = ' %s' % change['new']
        else:
            backend = ''
        self.log.error("Support for specifying --pylab on the command line has been removed.")
        self.log.error(
            "Please use `%pylab{0}` or `%matplotlib{0}` in the notebook itself.".format(backend)
        )
        self.exit(1)

    # TODO: Remove me in notebook 5.0
    server_extensions = List(Unicode(), config=True,
        help=("DEPRECATED use the nbserver_extensions dict instead")
    )
    
    @observe('server_extensions')
    def _update_server_extensions(self, change):
        self.log.warning("server_extensions is deprecated, use nbserver_extensions")
        self.server_extensions = change['new']

#-----------------------------------------------------------------------------
# Main entry point
#-----------------------------------------------------------------------------

main = launch_new_instance = NotebookApp.launch_instance
