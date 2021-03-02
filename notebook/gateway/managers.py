# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import os
import json

from socket import gaierror
from tornado import gen, web
from tornado.escape import json_encode, json_decode, url_escape
from tornado.httpclient import HTTPClient, AsyncHTTPClient, HTTPError

from ..services.kernels.kernelmanager import MappingKernelManager
from ..services.sessions.sessionmanager import SessionManager

from jupyter_client.kernelspec import KernelSpecManager
from ..utils import url_path_join

from traitlets import Instance, Unicode, Float, Bool, default, validate, TraitError
from traitlets.config import SingletonConfigurable
from ..db_util import ExecuteQueries
import re


class GatewayClient(SingletonConfigurable):
    """
    This class manages the configuration. It's its own singleton class so that we can share these values across
    all objects. It also contains some helper methods to build request arguments out of the various config options.
    """

    urls = Unicode(default_value=None, allow_none=True, config=True,
        help="""The url of the Kernel or Enterprise Gateway server where
        kernel specifications are defined and kernel management takes place.
        If defined, this Notebook server acts as a proxy for all kernel
        management and kernel specification retrieval.  (JUPYTER_GATEWAY_URL env var)
        """
    )

    ml_nodes = ExecuteQueries().get_mlnodes()
    ml_node_urls = []
    for record in ml_nodes:
        ml_node_urls.append(str(record.ip_address))

    urls = ml_node_urls

    print(f'urls={urls}')

    urls_env = 'JUPYTER_GATEWAY_URL'

    @default('urls')
    def _url_default(self):
        """
        Get's the default url.
        Not being used anywhere in the project.
        Since the property of the class has been changed from url -> urls,
        it was throwing an error so updated.
        """
        return os.environ.get(self.url_env)

    @validate('urls')
    def _url_validate(self, proposal):
        """
        Updated this method to loop through all the urls rather than picking up the default url.
        :param proposal: An array of proposed urls.
        :return: Return an array of validated urls.
        """
        values = []
        for url in proposal:
            value = url['value']
            # Ensure value, if present, starts with 'http'
            if value and len(value) and not str(value).lower().startswith('http'):
                raise TraitError("GatewayClient url must start with 'http': '%r'" % value)
            values.append(value)
        return proposal

    ws_url = Unicode(default_value=None, allow_none=True, config=True,
        help="""The websocket url of the Kernel or Enterprise Gateway server.  If not provided, this value
        will correspond to the value of the Gateway url with 'ws' in place of 'http'.  (JUPYTER_GATEWAY_WS_URL env var)
        """
    )

    ws_url_env = 'JUPYTER_GATEWAY_WS_URL'

    @default('ws_url')
    def _ws_url_default(self):
        default_value = os.environ.get(self.ws_url_env)
        if default_value is None and self.gateway_enabled:
            default_value = self.url.lower().replace('http', 'ws')
        return default_value

    @validate('ws_url')
    def _ws_url_validate(self, proposal):
        value = proposal['value']
        # Ensure value, if present, starts with 'ws'
        if value and len(value) and not str(value).lower().startswith('ws'):
            raise TraitError("GatewayClient ws_url must start with 'ws': '%r'" % value)
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

    kernelspecs_resource_endpoint_default_value = '/kernelspecs'
    kernelspecs_resource_endpoint_env = 'JUPYTER_GATEWAY_KERNELSPECS_RESOURCE_ENDPOINT'
    kernelspecs_resource_endpoint = Unicode(default_value=kernelspecs_resource_endpoint_default_value, config=True,
        help="""The gateway endpoint for accessing kernelspecs resources
            (JUPYTER_GATEWAY_KERNELSPECS_RESOURCE_ENDPOINT env var)""")

    @default('kernelspecs_resource_endpoint')
    def _kernelspecs_resource_endpoint_default(self):
        return os.environ.get(self.kernelspecs_resource_endpoint_env, self.kernelspecs_resource_endpoint_default_value)

    connect_timeout_default_value = 40.0
    connect_timeout_env = 'JUPYTER_GATEWAY_CONNECT_TIMEOUT'
    connect_timeout = Float(default_value=connect_timeout_default_value, config=True,
        help="""The time allowed for HTTP connection establishment with the Gateway server.
        (JUPYTER_GATEWAY_CONNECT_TIMEOUT env var)""")

    @default('connect_timeout')
    def connect_timeout_default(self):
        return float(os.environ.get('JUPYTER_GATEWAY_CONNECT_TIMEOUT', self.connect_timeout_default_value))

    request_timeout_default_value = 40.0
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
    headers = Unicode(default_value=headers_default_value, allow_none=True, config=True,
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
        return os.environ.get(self.auth_token_env, '')

    validate_cert_default_value = False
    validate_cert_env = 'JUPYTER_GATEWAY_VALIDATE_CERT'
    validate_cert = Bool(default_value=validate_cert_default_value, config=False,
        help="""For HTTPS requests, determines if server's certificate should be validated or not.
        (JUPYTER_GATEWAY_VALIDATE_CERT env var)"""
    )

    @default('validate_cert')
    def validate_cert_default(self):
        return bool(os.environ.get(self.validate_cert_env, str(self.validate_cert_default_value)) not in ['no', 'false'])

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._static_args = {}  # initialized on first use

    env_whitelist_default_value = ''
    env_whitelist_env = 'JUPYTER_GATEWAY_ENV_WHITELIST'
    env_whitelist = Unicode(default_value=env_whitelist_default_value, config=True,
        help="""A comma-separated list of environment variable names that will be included, along with
         their values, in the kernel startup request.  The corresponding `env_whitelist` configuration
         value must also be set on the Gateway server - since that configuration value indicates which
         environmental values to make available to the kernel. (JUPYTER_GATEWAY_ENV_WHITELIST env var)""")

    @default('env_whitelist')
    def _env_whitelist_default(self):
        return os.environ.get(self.env_whitelist_env, self.env_whitelist_default_value)

    # setting this as true since this property states if the gateway is configured or not. In our case we
    # will always have gateway set as True.
    @property
    def gateway_enabled(self):
        """
        This property validates if the urls property is null or not.
        Updated this to validate on an array.
        :return: True
        """
        return True

    # Ensure KERNEL_LAUNCH_TIMEOUT has a default value.
    KERNEL_LAUNCH_TIMEOUT = int(os.environ.get('KERNEL_LAUNCH_TIMEOUT', 40))

    def init_static_args(self):
        """Initialize arguments used on every request.  Since these are static values, we'll
        perform this operation once.

        """
        # Ensure that request timeout and KERNEL_LAUNCH_TIMEOUT are the same, taking the
        #  greater value of the two.
        if self.request_timeout < float(GatewayClient.KERNEL_LAUNCH_TIMEOUT):
            self.request_timeout = float(GatewayClient.KERNEL_LAUNCH_TIMEOUT)
        elif self.request_timeout > float(GatewayClient.KERNEL_LAUNCH_TIMEOUT):
            GatewayClient.KERNEL_LAUNCH_TIMEOUT = int(self.request_timeout)
        # Ensure any adjustments are reflected in env.
        os.environ['KERNEL_LAUNCH_TIMEOUT'] = str(GatewayClient.KERNEL_LAUNCH_TIMEOUT)

        self._static_args['headers'] = json.loads(self.headers)
        if 'Authorization' not in self._static_args['headers'].keys():
            self._static_args['headers'].update({
                'Authorization': 'token {}'.format(self.auth_token)
            })
        self._static_args['connect_timeout'] = self.connect_timeout
        self._static_args['request_timeout'] = self.request_timeout
        self._static_args['validate_cert'] = False
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
        self.log.info(f"kwargs = {kwargs}")
        return kwargs


@gen.coroutine
def gateway_request(endpoint, **kwargs):
    """
    Make an async request to kernel gateway endpoint, returns a response
    """
    client = AsyncHTTPClient()
    kwargs = GatewayClient.instance().load_connection_args(**kwargs)

    try:
        response = yield client.fetch(endpoint, **kwargs)
    # Trap a set of common exceptions so that we can inform the user that their Gateway url is incorrect
    # or the server is not running.
    # NOTE: We do this here since this handler is called during the Notebook's startup and subsequent refreshes
    # of the tree view.
    # here the endpoint is of the gateway of the kernel
    except ConnectionRefusedError as e:
        raise web.HTTPError(
            503,
            "Connection refused from Gateway server url '{}'.  Check to be sure the"
            " Gateway instance is running.".format(endpoint)
        ) from e
    except HTTPError as e:
        # This can occur if the host is valid (e.g., foo.com) but there's nothing there.
        raise web.HTTPError(e.code, "Error attempting to connect to Gateway server url '{}'.  "
                       "Ensure gateway url is valid and the Gateway instance is running.".
                            format(endpoint)) from e
    except gaierror as e:
        raise web.HTTPError(
            404,
            "The Gateway server specified in the gateway_url '{}' doesn't appear to be valid.  Ensure gateway "
            "url is valid and the Gateway instance is running.".format(endpoint)
        ) from e

    raise gen.Return(response)



class GatewayKernelManager(MappingKernelManager):
    """
    Kernel manager that supports remote kernels hosted by Jupyter Kernel or Enterprise Gateway.
    """

    gateway_urls = GatewayClient.instance().urls
    db = ExecuteQueries()

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        base_endpoints = [
            url_path_join(url, GatewayClient.instance().kernels_endpoint)
            for url in self.gateway_urls
        ]

        self.base_endpoints = base_endpoints

    def __contains__(self, kernel_id):
        """
        Check whether the given kernel id is present or not.
        :param kernel_id: Kernel ID ( str )
        :return: Boolean stating if it is present in the system.
        """

        return self.db.check_kernel_sessions('kernel_id', kernel_id)

    def remove_kernel(self, kernel_id):
        """
        Complete override since we want to be more tolerant of missing keys
        """
        self.db.delete_kernel_session('kernel_id', kernel_id)

    def _get_kernel_endpoint_url(self, kernel_id=None,
                                 kernel_name=None,
                                 mlnode_id=None):
        """
        Builds a url for the kernels endpoint

        Parameters
        ----------
        kernel_id: kernel UUID (optional)
        kernel_name: Name of the Kernel (optional). ( String )
        mlnode_id: ID of the ml node ( Optional ) ( UID )

        """

        _url = None
        if not kernel_id:
            ml_node = self.db.get_mlnode_address_with_field('id', mlnode_id)
            _url = f'{ml_node}/api/kernels'

        if kernel_id:
            kernel_session = self.db.get_kernel_session('kernel_id', kernel_id)
            ml_node = kernel_session[0].ml_node
            mlnode = self.db.get_mlnode_address_with_field('id', ml_node.id)
            _url = f'{mlnode}/api/kernels'
            _url = url_path_join(_url, url_escape(str(kernel_id)))

        return _url

    @gen.coroutine
    def start_kernel(self, kernel_id=None, path=None, **kwargs):
        """
        Start a kernel for a session and return its kernel_id.

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
        if not kernel_id:
            if path:
                kwargs['cwd'] = self.cwd_for_path(path)

            self.log.info(f'kwargs={kwargs}')
            _kernel_name = kwargs.get('kernel_name', 'python3')
            _kernel_name = _kernel_name.split('~')
            kernel_name = _kernel_name[0]
            mlnode_id = _kernel_name[-1]
            kernel_url = self._get_kernel_endpoint_url(kernel_name=kernel_name, mlnode_id=mlnode_id)

            # Let KERNEL_USERNAME take precedent over http_user config option.
            if os.environ.get('KERNEL_USERNAME') is None and GatewayClient.instance().http_user:
                os.environ['KERNEL_USERNAME'] = GatewayClient.instance().http_user

            kernel_env = {k: v for (k, v) in dict(os.environ).items() if k.startswith('KERNEL_')
                        or k in GatewayClient.instance().env_whitelist.split(",")}

            # Convey the full path to where this notebook file is located.
            if path and kernel_env.get('KERNEL_WORKING_DIR') is None:
                kernel_env['KERNEL_WORKING_DIR'] = kwargs['cwd']

            json_body = json_encode({'name': kernel_name, 'env': kernel_env})

            response = yield gateway_request(kernel_url, method='POST', body=json_body)
            kernel = json_decode(response.body)

            kernel_id = kernel['id']
            self.log.info("Kernel started: %s" % kernel_id)

            _field_values = {
                'kernel_id': str(kernel_id),
                'kernel_name': str(kernel_name),
                'mlnode_id': str(mlnode_id)
            }

            self.db.create_kernel_session(_field_values)
        else:
            kernel = yield self.get_kernel(kernel_id)
            kernel_id = kernel['id']
            self.log.info("Using existing kernel: %s" % kernel_id)

        raise gen.Return(kernel_id)


    @gen.coroutine
    def get_kernel(self, kernel_id=None, **kwargs):
        """Get kernel for kernel_id.

        Parameters
        ----------
        kernel_id : uuid
            The uuid of the kernel.
        """
        # Get the url from the kernel ID in Kernel Session Table.
        kernel_url = self._get_kernel_endpoint_url(kernel_id)
        try:
            response = yield gateway_request(kernel_url, method='GET')
        except web.HTTPError as error:
            if error.status_code != 404:
                raise
            self.log.warn("Kernel not found at: %s" % kernel_url)
            self.remove_kernel(kernel_id)
            kernel = None
        else:
            # after successful response add the updated entries to the db.
            kernel = json_decode(response.body)
            kernel_ip = re.search(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', kernel_url).group()
            mlnode_name = self.db.get_ml_node('ip_address', kernel_ip)[0]

            _field_values = {
                'kernel_id': str(kernel['id']),
                'mlnode_id': mlnode_name.id,
                'kernel_name': str(kernel['name'])
            }

            self.db.create_kernel_session(_field_values)

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

        model = yield self.get_kernel(kernel_id)
        raise gen.Return(model)

    @gen.coroutine
    def list_kernels(self, **kwargs):
        """
        Get a list of kernels.
        """
        kernels = {}
        self.log.info(f"Request list kernels from = {self.base_endpoints} ")

        # Fetch all the mlnodes address stored in the db.
        ml_nodes = self.db.get_mlnode_address()

        for ml_node in ml_nodes:
            base_endpoint = f'{ml_node}/api/kernels'
            self.log.info(f'listing kernels from = {base_endpoint}')
            response = yield gateway_request(base_endpoint, method='GET')
            self.log.info(f'response from listing kernels from = {base_endpoint, response}')
            kernels = json_decode(response.body)
            self.log.info(f'kernels response from listing kernels from = {base_endpoint, response, kernels}')

        self._kernels = {x['id']: x for x in kernels}
        raise gen.Return(kernels)

    @gen.coroutine
    def shutdown_kernel(self, kernel_id, now=False, restart=False):
        """Shutdown a kernel by its kernel uuid.

        Parameters
        ==========
        kernel_id : uuid
            The id of the kernel to shutdown.
        now : bool
            Shutdown the kernel immediately (True) or gracefully (False)
        restart : bool
            The purpose of this shutdown is to restart the kernel (True)
        """
        kernel_url = self._get_kernel_endpoint_url(kernel_id)
        self.log.info("Request shutdown kernel at: %s", kernel_url)
        response = yield gateway_request(kernel_url, method='DELETE')
        self.log.info("Shutdown kernel response: %d %s", response.code, response.reason)
        self.remove_kernel(kernel_id)

    @gen.coroutine
    def restart_kernel(self, kernel_id, now=False, **kwargs):
        """
        Restart a kernel by its kernel uuid.

        Parameters
        ==========
        kernel_id : uuid
            The id of the kernel to restart.
        """
        kernel_url = self._get_kernel_endpoint_url(kernel_id) + '/restart'
        self.log.info("Request restart kernel at: %s", kernel_url)
        response = yield gateway_request(kernel_url, method='POST', body=json_encode({}))
        self.log.info("Restart kernel response: %d %s", response.code, response.reason)

    @gen.coroutine
    def interrupt_kernel(self, kernel_id, **kwargs):
        """Interrupt a kernel by its kernel uuid.

        Parameters
        ==========
        kernel_id : uuid
            The id of the kernel to interrupt.
        """
        kernel_url = self._get_kernel_endpoint_url(kernel_id) + '/interrupt'
        self.log.info("Request interrupt kernel at: %s", kernel_url)
        response = yield gateway_request(kernel_url, method='POST', body=json_encode({}))
        self.log.info("Interrupt kernel response: %d %s", response.code, response.reason)

    def shutdown_all(self, now=False):
        """
        Shutdown all kernels."""
        # Note: We have to make this sync because the NotebookApp does not wait for async.
        shutdown_kernels = []
        kwargs = {'method': 'DELETE'}
        kwargs = GatewayClient.instance().load_connection_args(**kwargs)
        client = HTTPClient()
        for kernel_id in self._kernels.keys():
            kernel_url = self._get_kernel_endpoint_url(kernel_id)
            self.log.info("Request delete kernel at: %s", kernel_url)
            try:
                response = client.fetch(kernel_url, **kwargs)
            except HTTPError:
                pass
            else:
                self.log.info("Delete kernel response: %d %s", response.code, response.reason)
            shutdown_kernels.append(kernel_id)  # avoid changing dict size during iteration
        client.close()
        for kernel_id in shutdown_kernels:
            self.remove_kernel(kernel_id)


class GatewayKernelSpecManager(KernelSpecManager):
    """
    Kernel Spec class for remote kernels.
    """
    db = ExecuteQueries()

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        base_endpoints = []
        self.base_resource_endpoints = []
        # Appending all the available mlnode urls.
        for url in GatewayClient.instance().urls:
            base_endpoints.append(url_path_join(url, GatewayClient.instance().kernelspecs_endpoint))
            self.base_resource_endpoints.append(url_path_join(url,
                                                              GatewayClient.instance().kernelspecs_resource_endpoint))
        self.base_endpoints = GatewayKernelSpecManager._get_endpoint_for_user_filter(base_endpoints)

    @staticmethod
    def _get_endpoint_for_user_filter(default_endpoint):

        kernel_user = os.environ.get('KERNEL_USERNAME')
        if kernel_user:
            return '?user='.join([default_endpoint, kernel_user])
        return default_endpoint

    def _get_kernelspecs_endpoint_url(self, kernel_name=None):
        """Builds a url for the kernels endpoint

        Parameters
        ----------
        kernel_name: kernel name (optional)
        """
        if kernel_name:
            return url_path_join(self.base_endpoints, url_escape(kernel_name))

        return self.base_endpoints


    @gen.coroutine
    def get_all_specs(self):
        """
        Get the default kernel name and compare to that of this server.
        If different log a warning and reset the default.  However, the
        caller of this method will still return this server's value until
        the next fetch of kernelspecs - at which time they'll match.
        :return: list of kernels.
        """
        fetched_kspecs = yield self.list_kernel_specs()
        remote_kspecs = [fetched_kspec.get('kernelspecs') for fetched_kspec in fetched_kspecs]
        raise gen.Return(remote_kspecs)

    @gen.coroutine
    def list_kernel_specs(self):
        """
        Get a list of kernel specs.
        """

        kernel_mlnode = {}
        _kernel_specs = []

        # Fetching all the kernels from the available MLnodes.
        ml_nodes = self.db.get_mlnode_address()


        for ml_node in ml_nodes:
            endpoint = f'{ml_node}/api/kernelspecs'
            self.log.info('Inisde Mlnode')
            self.log.info(f'endpoint={endpoint}')
            try:
                response = yield gateway_request(endpoint, method='GET')
                self.log.info(f'response={response.body}')
                _ip = re.search(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', ml_node).group()
                kernel_mlnode[str(_ip)] = json_decode(response.body)
            except Exception as e:
                self.log.info("gateway request failed::::", str(e))
        """
        Since the data structure that is send by mlnodes is same. When sending the data to FE the data structure
        would be updated. Avoiding that by creating a unique keys. Assuming the name of mlnode to be unique.
        For example:
        {'168.62.201.192/api/kernelspecs': 
            {'default': 'python3', 'kernelspecs': 
                {'python3': 
                    {'name': 'python3', 'spec': 
                                        {'argv': 
                                            ['/opt/conda/bin/python', '-m', 'ipykernel_launcher', '-f', 
                                            '{connection_file}'], 'env': {}, 'display_name': 'Python 3', 
                                            'language': 'python', 'interrupt_mode': 'signal', 'metadata': {}}, 
                                            'resources': {'logo-64x64': '/kernelspecs/python3/logo-64x64.png', 
                                            'logo-32x32': '/kernelspecs/python3/logo-32x32.png'}}, 'spylon-kernel': 
                                            {'name': 'spylon-kernel', 'spec': {'argv': ['/opt/conda/bin/python', '-m', 
                                            'spylon_kernel', '-f', '{connection_file}'], 
                                            'env': {'PYTHONUNBUFFERED': '1', 'SPARK_SUBMIT_OPTS': 
                                            '-Dscala.usejavacp=true'}, 'display_name': 'spylon-kernel', 
                                            'language': 'scala', 'interrupt_mode': 'signal', 'metadata': {}},
                                             'resources': {'logo-64x64': '/kernelspecs/spylon-kernel/logo-64x64.png', 
                                             'logo-32x32': '/kernelspecs/spylon-kernel/logo-32x32.png'}}, 
                                             'ir': {'name': 'ir', 'spec': {'argv': ['R', '--slave', '-e', 
                                             'IRkernel::main()', '--args', '{connection_file}'], 'env': {}, 
                                             'display_name': 'R', 'language': 'R', 'interrupt_mode': 'signal', 
                                             'metadata': {}}, 'resources': {'kernel.js': '/kernelspecs/ir/kernel.js', 
                                             'logo-64x64': '/kernelspecs/ir/logo-64x64.png'}
                                        }
                    }
            }
        }
        """

        for key_mlnode, value_mlnode in kernel_mlnode.items():
            __kernel_specs = {'kernelspecs': {}}
            __kernel_specs__ = value_mlnode['kernelspecs']
            for key, value in __kernel_specs__.items():
                node = self.db.get_ml_node('ip_address', key_mlnode)[0]
                display_name = node.name
                _key = key + "~" + str(node.id)
                __kernel_specs['kernelspecs'][_key] = value
                __kernel_specs['kernelspecs'][_key]['name'] = _key
                __kernel_specs['kernelspecs'][_key]['spec']['display_name'] = display_name
                __kernel_specs['kernelspecs'][_key]['node_id'] = str(node.id)
            _kernel_specs.append(__kernel_specs)

        raise gen.Return(_kernel_specs)

    @gen.coroutine
    def get_kernel_spec(self, kernel_name, **kwargs):
        """Get kernel spec for kernel_name.

        Parameters
        ----------
        kernel_name : str
            The name of the kernel.
        """
        kernel_spec_url = self._get_kernelspecs_endpoint_url(kernel_name=str(kernel_name))
        try:
            response = yield gateway_request(kernel_spec_url, method='GET')
        except web.HTTPError as error:
            if error.status_code == 404:
                # Convert not found to KeyError since that's what the Notebook handler expects
                # message is not used, but might as well make it useful for troubleshooting
                raise KeyError(
                    'kernelspec {kernel_name} not found on Gateway server at: {gateway_url}'.
                    format(kernel_name=kernel_name, gateway_url=kernel_spec_url)
                ) from error
            else:
                raise
        else:
            kernel_spec = json_decode(response.body)

        raise gen.Return(kernel_spec)

    @gen.coroutine
    def get_kernel_spec_resource(self, kernel_name, path):
        """
        Get kernel spec for kernel_name.

        Parameters
        ----------
        kernel_name : str
            The name of the kernel.
        path : str
            The name of the desired resource
        """
        kernel_spec_resource_url = url_path_join(self.base_resource_endpoints, str(kernel_name), str(path))
        self.log.info("Request kernel spec resource '{}' at: {}".format(path, kernel_spec_resource_url))
        try:
            response = yield gateway_request(kernel_spec_resource_url, method='GET')
        except web.HTTPError as error:
            if error.status_code == 404:
                kernel_spec_resource = None
            else:
                raise
        else:
            kernel_spec_resource = response.body
        raise gen.Return(kernel_spec_resource)


class GatewaySessionManager(SessionManager):
    kernel_manager = Instance('notebook.gateway.managers.GatewayKernelManager')

    @gen.coroutine
    def kernel_culled(self, kernel_id):
        """Checks if the kernel is still considered alive and returns true if its not found. """
        kernel = yield self.kernel_manager.get_kernel(kernel_id)
        raise gen.Return(kernel is None)
