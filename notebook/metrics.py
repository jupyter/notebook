"""
Prometheus metrics exported by Jupyter Notebook Server

Read https://prometheus.io/docs/practices/naming/ for naming
conventions for metrics & labels.
"""

from prometheus_client import Histogram

# This is a fairly standard name for HTTP request latency reporting.
REQUEST_DURATION_SECONDS = Histogram(
    'request_duration_seconds',
    'request duration for all HTTP requests',
    ['method', 'handler', 'code'],
)

def prometheus_log_method(handler):
    """
    Tornado log handler for recording RED metrics.

    We record the following metrics:
       Rate - the number of requests, per second, your services are serving.
       Errors - the number of failed requests per second.
       Duration - The amount of time each request takes expressed as a time interval.

    We use a fully qualified name of the handler as a label,
    rather than every url path to reduce cardinality.

    This function should be either the value of or called from a function
    that is the 'log_function' tornado setting. This makes it get called
    at the end of every request, allowing us to record the metrics we need.
    """
    REQUEST_DURATION_SECONDS.labels(
        method=handler.request.method,
        handler='{}.{}'.format(handler.__class__.__module__, type(handler).__name__),
        code=handler.get_status()
    ).observe(handler.request.request_time())
