#-----------------------------------------------------------------------------
#  Copyright (c) Jupyter Development Team
#
#  Distributed under the terms of the BSD License.  The full license is in
#  the file COPYING, distributed as part of this software.
#-----------------------------------------------------------------------------

import json

try:
    from urllib.parse import urlparse, urlunparse
except ImportError:
    # py2
    from urllib import urlparse, urlunparse

from tornado.log import access_log
from tornado.web import StaticFileHandler


# url params to be scrubbed if seen
# any url param that *contains* one of these
# will be scrubbed from logs
SCRUB_PARAM_KEYS = ('token', 'auth', 'key', 'code', 'state')


def _scrub_uri(uri):
    """scrub auth info from uri"""
    parsed = urlparse(uri)
    if parsed.query:
        # check for potentially sensitive url params
        # use manual list + split rather than parsing
        # to minimally perturb original
        parts = parsed.query.split('&')
        changed = False
        for i, s in enumerate(parts):
            if '=' in s:
                key, value = s.split('=', 1)
                for substring in SCRUB_PARAM_KEYS:
                    if substring in key:
                        parts[i] = key + '=[secret]'
                        changed = True
        if changed:
            parsed = parsed._replace(query='&'.join(parts))
            return urlunparse(parsed)
    return uri


def _scrub_headers(headers):
    """scrub auth info from headers"""
    headers = dict(headers)
    if 'Authorization' in headers:
        auth = headers['Authorization']
        if auth.startswith('token '):
            headers['Authorization'] = 'token [secret]'
    return headers


def log_request(handler):
    """log a bit more information about each request than tornado's default

    - move static file get success to debug-level (reduces noise)
    - get proxied IP instead of proxy IP
    - log referer for redirect and failed requests
    - log user-agent for failed requests
    """
    status = handler.get_status()
    request = handler.request

    if (
        isinstance(handler, StaticFileHandler)
        and (status < 300 or status == 304)
    ):
        # Successes (or 304 FOUND) on static files are debug-level
        log_method = access_log.debug
    elif status < 400:
        log_method = access_log.info
    elif status < 500:
        log_method = access_log.warning
    else:
        log_method = access_log.error

    request_time = 1000.0 * handler.request.request_time()
    ns = dict(
        status=status,
        method=request.method,
        ip=request.remote_ip,
        uri=_scrub_uri(request.uri),
        request_time=request_time,
    )
    msg = "{status} {method} {uri} ({ip}) {request_time:.2f}ms"
    if status >= 400:
        # log bad referers
        ns['referer'] = _scrub_uri(request.headers.get('Referer', 'None'))
        msg = msg + ' referer={referer}'
    if status >= 500 and status != 502:
        # log all headers if it caused an error
        log_method(json.dumps(_scrub_headers(request.headers), indent=2))
    log_method(msg.format(**ns))
