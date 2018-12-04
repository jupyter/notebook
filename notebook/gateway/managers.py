# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import os
import json

from tornado import gen
from tornado.escape import json_encode, json_decode, url_escape
from tornado.httpclient import HTTPClient, AsyncHTTPClient, HTTPError

from ..services.kernels.kernelmanager import MappingKernelManager
from ..services.sessions.sessionmanager import SessionManager

from jupyter_client.kernelspec import KernelSpecManager
from ..utils import url_path_join

from traitlets import Instance, Unicode, Float, Bool, default, validate, TraitError
from traitlets.config import SingletonConfigurable


@gen.coroutine
def fetch_gateway(endpoint, **kwargs):
    """Make an async request to kernel gateway endpoint."""
    client = AsyncHTTPClient()

    kwargs = Gateway.instance().load_connection_args(**kwargs)

    response = yield client.fetch(endpoint, **kwargs)
    raise gen.Return(response)


class Gateway(SingletonConfigurable):
    """This class manages the configuration.  It's its own class so that we can avoid having command
       line options of the likes `--GatewayKernelManager.connect_timeout` and use the shorter and more
       applicable `--Gateway.connect_timeout`, etc.  It also contains some helper methods to build
       request arguments out of the various config options.

    """

    url = Unicode(default_value=None, allow_none=True, config=True,
        help="""The url of the Kernel or Enterprise Gateway server where
        kernel specifications are defined and kernel management takes place.
        If defined, this Notebook server acts as a proxy for all kernel
        management and kernel specification retrieval.  (JUPYTER_GATEWAY_URL env var)
        """
    )

    url_env = 'JUPYTER_GATEWAY_URL'
    @default('url')
    def _url_default(self):
        return os.environ.get(self.url_env)

    @validate('url')
    def _url_validate(self, proposal):
        value = proposal['value']
        # Ensure value, if present, starts with 'http'
        if value is not None and len(value) > 0:
            if not str(value).lower().startswith('http'):
                raise TraitError("Gateway url must start with 'http': '%r'" % value)
        return value

    ws_url = Unicode(default_value=None, allow_none=True, config=True,
        help="""The websocket url of the Kernel or Enterprise Gateway server.  If not provided, this value
        will correspond to the value of the Gateway url with 'ws' in place of 'http'.  (JUPYTER_GATEWAY_WS_URL env var)
        """
    )

    ws_url_env = 'JUPYTER_GATEWAY_WS_URL'
    @default('ws_url')
    def _ws_url_default(self):
        default_value = os.environ.get(self.ws_url_env)
        if default_value is None:
            if self.gateway_enabled:
                default_value = self.url.lower().replace('http', 'ws')
        return default_value

    @validate('ws_url')
    def _ws_url_validate(self, proposal):
        value = proposal['value']
        # Ensure value, if present, starts with 'ws'
        if value is not None and len(value) > 0:
            if not str(value).lower().startswith('ws'):
                raise TraitError("Gateway ws_url must start with 'ws': '%r'" % value)
        return value

    kernels_endpoint_default_value = '/api/kernels'
    kernels_endpoint_env = 'JUPYTER_GATEWAY_KERNELS_ENDPOINT'
    kernels_endpoint = Unicode(default_value=kernels_endpoint_default_value, config=True,
        help="""The gateway API endpoint for accessing kernel resources (JUPYTER_GATEWAY_KERNELS_ENDPOINT env var)""")

    @default('kernels_endpoint')
    def _kernels_endpoint_default(self):
        return os.environ.get(self.kernels_endpoint_env, self.kernels_endpoint_default_value)

    kernelspecs_endpoint_default_value = '/api/kernelspecs'
    kernelspecs_endpoint_env = 'JUPYTER_GATEWAY_KERNELSPECS_ENDPOINT'
    kernelspecs_endpoint = Unicode(default_value=kernelspecs_endpoint_default_value, config=True,
        help="""The gateway API endpoint for accessing kernelspecs (JUPYTER_GATEWAY_KERNELSPECS_ENDPOINT env var)""")

    @default('kernelspecs_endpoint')
    def _kernelspecs_endpoint_default(self):
        return os.environ.get(self.kernelspecs_endpoint_env, self.kernelspecs_endpoint_default_value)

    connect_timeout_default_value = 20.0
    connect_timeout_env = 'JUPYTER_GATEWAY_CONNECT_TIMEOUT'
    connect_timeout = Float(default_value=connect_timeout_default_value, config=True,
        help="""The time allowed for HTTP connection establishment with the Gateway server.
        (JUPYTER_GATEWAY_CONNECT_TIMEOUT env var)""")

    @default('connect_timeout')
    def connect_timeout_default(self):
        return float(os.environ.get('JUPYTER_GATEWAY_CONNECT_TIMEOUT', self.connect_timeout_default_value))

    request_timeout_default_value = 20.0
    request_timeout_env = 'JUPYTER_GATEWAY_REQUEST_TIMEOUT'
    request_timeout = Float(default_value=request_timeout_default_value, config=True,
        help="""The time allowed for HTTP request completion. (JUPYTER_GATEWAY_REQUEST_TIMEOUT env var)""")

    @default('request_timeout')
    def request_timeout_default(self):
        return float(os.environ.get('JUPYTER_GATEWAY_REQUEST_TIMEOUT', self.request_timeout_default_value))

    client_key = Unicode(default_value=None, allow_none=True, config=True,
        help="""The filename for client SSL key, if any.  (JUPYTER_GATEWAY_CLIENT_KEY env var)
        """
    )
    client_key_env = 'JUPYTER_GATEWAY_CLIENT_KEY'

    @default('client_key')
    def _client_key_default(self):
        return os.environ.get(self.client_key_env)

    client_cert = Unicode(default_value=None, allow_none=True, config=True,
        help="""The filename for client SSL certificate, if any.  (JUPYTER_GATEWAY_CLIENT_CERT env var)
        """
    )
    client_cert_env = 'JUPYTER_GATEWAY_CLIENT_CERT'

    @default('client_cert')
    def _client_cert_default(self):
        return os.environ.get(self.client_cert_env)

    ca_certs = Unicode(default_value=None, allow_none=True, config=True,
        help="""The filename of CA certificates or None to use defaults.  (JUPYTER_GATEWAY_CA_CERTS env var)
        """
    )
    ca_certs_env = 'JUPYTER_GATEWAY_CA_CERTS'

    @default('ca_certs')
    def _ca_certs_default(self):
        return os.environ.get(self.ca_certs_env)

    http_user = Unicode(default_value=None, allow_none=True, config=True,
        help="""The username for HTTP authentication. (JUPYTER_GATEWAY_HTTP_USER env var)
        """
    )
    http_user_env = 'JUPYTER_GATEWAY_HTTP_USER'

    @default('http_user')
    def _http_user_default(self):
        return os.environ.get(self.http_user_env)

    http_pwd = Unicode(default_value=None, allow_none=True, config=True,
        help="""The password for HTTP authentication.  (JUPYTER_GATEWAY_HTTP_PWD env var)
        """
    )
    http_pwd_env = 'JUPYTER_GATEWAY_HTTP_PWD'

    @default('http_pwd')
    def _http_pwd_default(self):
        return os.environ.get(self.http_pwd_env)

    headers_default_value = '{}'
    headers_env = 'JUPYTER_GATEWAY_HEADERS'
    headers = Unicode(default_value=headers_default_value, allow_none=True,config=True,
        help="""Additional HTTP headers to pass on the request.  This value will be converted to a dict.
          (JUPYTER_GATEWAY_HEADERS env var)
        """
    )

    @default('headers')
    def _headers_default(self):
        return os.environ.get(self.headers_env, self.headers_default_value)

    auth_token = Unicode(default_value=None, allow_none=True, config=True,
        help="""The authorization token used in the HTTP headers.  (JUPYTER_GATEWAY_AUTH_TOKEN env var)
        """
    )
    auth_token_env = 'JUPYTER_GATEWAY_AUTH_TOKEN'

    @default('auth_token')
    def _auth_token_default(self):
        return os.environ.get(self.auth_token_env)

    validate_cert_default_value = True
    validate_cert_env = 'JUPYTER_GATEWAY_VALIDATE_CERT'
    validate_cert = Bool(default_value=validate_cert_default_value, config=True,
        help="""For HTTPS requests, determines if server's certificate should be validated or not.
        (JUPYTER_GATEWAY_VALIDATE_CERT env var)"""
    )

    @default('validate_cert')
    def validate_cert_default(self):
        return bool(os.environ.get(self.validate_cert_env, str(self.validate_cert_default_value)) not in ['no', 'false'])

    def __init__(self, **kwargs):
        super(Gateway, self).__init__(**kwargs)
        self._static_args = {}  # initialized on first use

    @property
    def gateway_enabled(self):
        return bool(self.url is not None and len(self.url) > 0)

    def init_static_args(self):
        """Initialize arguments used on every request.  Since these are static values, we'll
        perform this operation once.

        """
        self._static_args['headers'] = json.loads(self.headers)
        self._static_args['headers'].update({'Authorization': 'token {}'.format(self.auth_token)})
        self._static_args['connect_timeout'] = self.connect_timeout
        self._static_args['request_timeout'] = self.request_timeout
        self._static_args['validate_cert'] = self.validate_cert
        if self.client_cert:
            self._static_args['client_cert'] = self.client_cert
            self._static_args['client_key'] = self.client_key
            if self.ca_certs:
                self._static_args['ca_certs'] = self.ca_certs
        if self.http_user:
            self._static_args['auth_username'] = self.http_user
        if self.http_pwd:
            self._static_args['auth_password'] = self.http_pwd

    def load_connection_args(self, **kwargs):
        """Merges the static args relative to the connection, with the given keyword arguments.  If statics
         have yet to be initialized, we'll do that here.

        """
        if len(self._static_args) == 0:
            self.init_static_args()

        kwargs.update(self._static_args)
        return kwargs

class GatewayKernelManager(MappingKernelManager):
    """Kernel manager that supports remote kernels hosted by Jupyter Kernel or Enterprise Gateway."""

    # We'll maintain our own set of kernel ids
    _kernels = {}

    def __init__(self, **kwargs):
        super(GatewayKernelManager, self).__init__(**kwargs)
        self.base_endpoint = url_path_join(Gateway.instance().url, Gateway.instance().kernels_endpoint)

    def __contains__(self, kernel_id):
        return kernel_id in self._kernels

    def remove_kernel(self, kernel_id):
        """Complete override since we want to be more tolerant of missing keys """
        try:
            return self._kernels.pop(kernel_id)
        except KeyError:
            pass

    def _get_kernel_endpoint_url(self, kernel_id=None):
        """Builds a url for the kernels endpoint

        Parameters
        ----------
        kernel_id: kernel UUID (optional)
        """
        if kernel_id:
            return url_path_join(self.base_endpoint, url_escape(str(kernel_id)))

        return self.base_endpoint

    @gen.coroutine
    def start_kernel(self, kernel_id=None, path=None, **kwargs):
        """Start a kernel for a session and return its kernel_id.

        Parameters
        ----------
        kernel_id : uuid
            The uuid to associate the new kernel with. If this
            is not None, this kernel will be persistent whenever it is
            requested.
        path : API path
            The API path (unicode, '/' delimited) for the cwd.
            Will be transformed to an OS path relative to root_dir.
        """
        self.log.info('Request start kernel: kernel_id=%s, path="%s"', kernel_id, path)

        if kernel_id is None:
            kernel_name = kwargs.get('kernel_name', 'python3')
            kernel_url = self._get_kernel_endpoint_url()
            self.log.debug("Request new kernel at: %s" % kernel_url)

            kernel_env = {k: v for (k, v) in dict(os.environ).items() if k.startswith('KERNEL_')
                        or k in os.environ.get('GATEWAY_ENV_WHITELIST', '').split(",")}
            json_body = json_encode({'name': kernel_name, 'env': kernel_env})

            response = yield fetch_gateway(kernel_url, method='POST', body=json_body)
            kernel = json_decode(response.body)
            kernel_id = kernel['id']
            self.log.info("Kernel started: %s" % kernel_id)
        else:
            kernel = yield self.get_kernel(kernel_id)
            kernel_id = kernel['id']
            self.log.info("Using existing kernel: %s" % kernel_id)

        self._kernels[kernel_id] = kernel
        raise gen.Return(kernel_id)

    @gen.coroutine
    def get_kernel(self, kernel_id=None, **kwargs):
        """Get kernel for kernel_id.

        Parameters
        ----------
        kernel_id : uuid
            The uuid of the kernel.
        """
        kernel_url = self._get_kernel_endpoint_url(kernel_id)
        self.log.debug("Request kernel at: %s" % kernel_url)
        try:
            response = yield fetch_gateway(kernel_url, method='GET')
        except HTTPError as error:
            if error.code == 404:
                self.log.warn("Kernel not found at: %s" % kernel_url)
                self.remove_kernel(kernel_id)
                kernel = None
            else:
                raise
        else:
            kernel = json_decode(response.body)
            self._kernels[kernel_id] = kernel
        self.log.info("Kernel retrieved: %s" % kernel)
        raise gen.Return(kernel)

    @gen.coroutine
    def kernel_model(self, kernel_id):
        """Return a dictionary of kernel information described in the
        JSON standard model.

        Parameters
        ----------
        kernel_id : uuid
            The uuid of the kernel.
        """
        self.log.debug("RemoteKernelManager.kernel_model: %s", kernel_id)
        model = yield self.get_kernel(kernel_id)
        raise gen.Return(model)

    @gen.coroutine
    def list_kernels(self, **kwargs):
        """Get a list of kernels."""
        kernel_url = self._get_kernel_endpoint_url()
        self.log.debug("Request list kernels: %s", kernel_url)
        response = yield fetch_gateway(kernel_url, method='GET')
        kernels = json_decode(response.body)
        self._kernels = {x['id']:x for x in kernels}
        raise gen.Return(kernels)

    @gen.coroutine
    def shutdown_kernel(self, kernel_id):
        """Shutdown a kernel by its kernel uuid.

        Parameters
        ==========
        kernel_id : uuid
            The id of the kernel to shutdown.
        """
        kernel_url = self._get_kernel_endpoint_url(kernel_id)
        self.log.debug("Request shutdown kernel at: %s", kernel_url)
        response = yield fetch_gateway(kernel_url, method='DELETE')
        self.log.debug("Shutdown kernel response: %d %s", response.code, response.reason)
        self.remove_kernel(kernel_id)

    @gen.coroutine
    def restart_kernel(self, kernel_id, now=False, **kwargs):
        """Restart a kernel by its kernel uuid.

        Parameters
        ==========
        kernel_id : uuid
            The id of the kernel to restart.
        """
        kernel_url = self._get_kernel_endpoint_url(kernel_id) + '/restart'
        self.log.debug("Request restart kernel at: %s", kernel_url)
        response = yield fetch_gateway(kernel_url, method='POST', body=json_encode({}))
        self.log.debug("Restart kernel response: %d %s", response.code, response.reason)

    @gen.coroutine
    def interrupt_kernel(self, kernel_id, **kwargs):
        """Interrupt a kernel by its kernel uuid.

        Parameters
        ==========
        kernel_id : uuid
            The id of the kernel to interrupt.
        """
        kernel_url = self._get_kernel_endpoint_url(kernel_id) + '/interrupt'
        self.log.debug("Request interrupt kernel at: %s", kernel_url)
        response = yield fetch_gateway(kernel_url, method='POST', body=json_encode({}))
        self.log.debug("Interrupt kernel response: %d %s", response.code, response.reason)

    def shutdown_all(self):
        """Shutdown all kernels."""
        # Note: We have to make this sync because the NotebookApp does not wait for async.
        kwargs = {'method': 'DELETE'}
        kwargs = Gateway.instance().load_connection_args(**kwargs)
        client = HTTPClient()
        for kernel_id in self._kernels.keys():
            kernel_url = self._get_kernel_endpoint_url(kernel_id)
            self.log.debug("Request delete kernel at: %s", kernel_url)
            try:
                response = client.fetch(kernel_url, **kwargs)
            except HTTPError:
                pass
            self.log.debug("Delete kernel response: %d %s", response.code, response.reason)
            self.remove_kernel(kernel_id)
        client.close()


class GatewayKernelSpecManager(KernelSpecManager):

    def __init__(self, **kwargs):
        super(GatewayKernelSpecManager, self).__init__(**kwargs)
        self.base_endpoint = url_path_join(Gateway.instance().url, Gateway.instance().kernelspecs_endpoint)

    def _get_kernelspecs_endpoint_url(self, kernel_name=None):
        """Builds a url for the kernels endpoint

        Parameters
        ----------
        kernel_name: kernel name (optional)
        """
        if kernel_name:
            return url_path_join(self.base_endpoint, url_escape(kernel_name))

        return self.base_endpoint

    @gen.coroutine
    def list_kernel_specs(self):
        """Get a list of kernel specs."""
        kernel_spec_url = self._get_kernelspecs_endpoint_url()
        self.log.debug("Request list kernel specs at: %s", kernel_spec_url)
        response = yield fetch_gateway(kernel_spec_url, method='GET')
        kernel_specs = json_decode(response.body)
        raise gen.Return(kernel_specs)

    @gen.coroutine
    def get_kernel_spec(self, kernel_name, **kwargs):
        """Get kernel spec for kernel_name.

        Parameters
        ----------
        kernel_name : str
            The name of the kernel.
        """
        kernel_spec_url = self._get_kernelspecs_endpoint_url(kernel_name=str(kernel_name))
        self.log.debug("Request kernel spec at: %s" % kernel_spec_url)
        try:
            response = yield fetch_gateway(kernel_spec_url, method='GET')
        except HTTPError as error:
            if error.code == 404:
                self.log.warn("Kernel spec not found at: %s" % kernel_spec_url)
                kernel_spec = None
            else:
                raise
        else:
            kernel_spec = json_decode(response.body)
        raise gen.Return(kernel_spec)


class GatewaySessionManager(SessionManager):
    kernel_manager = Instance('notebook.gateway.managers.GatewayKernelManager')

    @gen.coroutine
    def create_session(self, path=None, name=None, type=None,
                       kernel_name=None, kernel_id=None):
        """Creates a session and returns its model.
        
        Overrides base class method to turn into an async operation.
        """
        session_id = self.new_session_id()

        kernel = None
        if kernel_id is not None:
            # This is now an async operation
            kernel = yield self.kernel_manager.get_kernel(kernel_id)
        
        if kernel is not None:
            pass
        else:
            kernel_id = yield self.start_kernel_for_session(
                session_id, path, name, type, kernel_name,
            )

        result = yield self.save_session(
            session_id, path=path, name=name, type=type, kernel_id=kernel_id,
        )
        raise gen.Return(result)

    @gen.coroutine
    def save_session(self, session_id, path=None, name=None, type=None,
                     kernel_id=None):
        """Saves the items for the session with the given session_id

        Given a session_id (and any other of the arguments), this method
        creates a row in the sqlite session database that holds the information
        for a session.

        Parameters
        ----------
        session_id : str
            uuid for the session; this method must be given a session_id
        path : str
            the path for the given notebook
        kernel_id : str
            a uuid for the kernel associated with this session

        Returns
        -------
        model : dict
            a dictionary of the session model
        """
        # This is now an async operation
        session = yield super(GatewaySessionManager, self).save_session(
            session_id, path=path, name=name, type=type, kernel_id=kernel_id
        )
        raise gen.Return(session)

    @gen.coroutine
    def get_session(self, **kwargs):
        """Returns the model for a particular session.

        Takes a keyword argument and searches for the value in the session
        database, then returns the rest of the session's info.

        Overrides base class method to turn into an async operation.

        Parameters
        ----------
        **kwargs : keyword argument
            must be given one of the keywords and values from the session database
            (i.e. session_id, path, kernel_id)

        Returns
        -------
        model : dict
            returns a dictionary that includes all the information from the
            session described by the kwarg.
        """
        # This is now an async operation
        session = yield super(GatewaySessionManager, self).get_session(**kwargs)
        raise gen.Return(session)

    @gen.coroutine
    def update_session(self, session_id, **kwargs):
        """Updates the values in the session database.

        Changes the values of the session with the given session_id
        with the values from the keyword arguments.

        Overrides base class method to turn into an async operation.

        Parameters
        ----------
        session_id : str
            a uuid that identifies a session in the sqlite3 database
        **kwargs : str
            the key must correspond to a column title in session database,
            and the value replaces the current value in the session
            with session_id.
        """
        # This is now an async operation
        session = yield self.get_session(session_id=session_id)

        if not kwargs:
            # no changes
            return

        sets = []
        for column in kwargs.keys():
            if column not in self._columns:
                raise TypeError("No such column: %r" % column)
            sets.append("%s=?" % column)
        query = "UPDATE session SET %s WHERE session_id=?" % (', '.join(sets))
        self.cursor.execute(query, list(kwargs.values()) + [session_id])

    @gen.coroutine
    def row_to_model(self, row):
        """Takes sqlite database session row and turns it into a dictionary.

        Overrides base class method to turn into an async operation.
        """
        # Retrieve kernel for session, which is now an async operation
        kernel = yield self.kernel_manager.get_kernel(row['kernel_id'])
        if kernel is None:
            # The kernel was killed or died without deleting the session.
            # We can't use delete_session here because that tries to find
            # and shut down the kernel.
            self.cursor.execute("DELETE FROM session WHERE session_id=?",
                                (row['session_id'],))
            raise KeyError

        model = {
            'id': row['session_id'],
            'path': row['path'],
            'name': row['name'],
            'type': row['type'],
            'kernel': kernel
        }
        if row['type'] == 'notebook':  # Provide the deprecated API.
            model['notebook'] = {'path': row['path'], 'name': row['name']}

        raise gen.Return(model)

    @gen.coroutine
    def list_sessions(self):
        """Returns a list of dictionaries containing all the information from
        the session database.

        Overrides base class method to turn into an async operation.
        """
        c = self.cursor.execute("SELECT * FROM session")
        result = []
        # We need to use fetchall() here, because row_to_model can delete rows,
        # which messes up the cursor if we're iterating over rows.
        for row in c.fetchall():
            try:
                # This is now an async operation
                model = yield self.row_to_model(row)
                result.append(model)
            except KeyError:
                pass
        raise gen.Return(result)

    @gen.coroutine
    def delete_session(self, session_id):
        """Deletes the row in the session database with given session_id.

        Overrides base class method to turn into an async operation.
        """
        # This is now an async operation
        session = yield self.get_session(session_id=session_id)
        yield gen.maybe_future(self.kernel_manager.shutdown_kernel(session['kernel']['id']))
        self.cursor.execute("DELETE FROM session WHERE session_id=?", (session_id,))
