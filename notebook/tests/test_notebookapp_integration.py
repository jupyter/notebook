import os
import stat
import subprocess
import time

from ipython_genutils.testing.decorators import skip_win32, onlyif
from notebook import DEFAULT_NOTEBOOK_PORT

from .launchnotebook import UNIXSocketNotebookTestBase
from ..utils import urlencode_unix_socket, urlencode_unix_socket_path


@skip_win32
def test_shutdown_sock_server_integration():
    sock = UNIXSocketNotebookTestBase.sock
    url = urlencode_unix_socket(sock).encode()
    encoded_sock_path = urlencode_unix_socket_path(sock)

    p = subprocess.Popen(
        ['jupyter-notebook', '--sock=%s' % sock],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )

    for line in iter(p.stderr.readline, b''):
        if url in line:
            complete = True
            break

    assert complete, 'did not find socket URL in stdout when launching notebook'

    assert encoded_sock_path.encode() in subprocess.check_output(['jupyter-notebook', 'list'])

    # Ensure default umask is properly applied.
    assert stat.S_IMODE(os.lstat(sock).st_mode) == 0o600

    try:
        subprocess.check_output(['jupyter-notebook', 'stop'], stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        assert 'There is currently no server running on' in e.output.decode()
    else:
        raise AssertionError('expected stop command to fail due to target mis-match')

    assert encoded_sock_path.encode() in subprocess.check_output(['jupyter-notebook', 'list'])

    subprocess.check_output(['jupyter-notebook', 'stop', sock])

    assert encoded_sock_path.encode() not in subprocess.check_output(['jupyter-notebook', 'list'])

    p.wait()



def _ensure_stopped(check_msg='There are no running servers'):
    try:
        subprocess.check_output(
            ['jupyter-notebook', 'stop'],
            stderr=subprocess.STDOUT
        )
    except subprocess.CalledProcessError as e:
        assert check_msg in e.output.decode()
    else:
        raise AssertionError('expected all servers to be stopped')


@onlyif(bool(os.environ.get('RUN_NB_INTEGRATION_TESTS', False)), 'for local testing')
def test_stop_multi_integration():
    """Tests lifecycle behavior for mixed-mode server types w/ default ports.

    Mostly suitable for local dev testing due to reliance on default port binding.
    """
    TEST_PORT = '9797'
    MSG_TMPL = 'Shutting down server on {}...'

    _ensure_stopped()

    # Default port.
    p1 = subprocess.Popen(
        ['jupyter-notebook', '--no-browser']
    )

    # Unix socket.
    sock = UNIXSocketNotebookTestBase.sock
    p2 = subprocess.Popen(
        ['jupyter-notebook', '--sock=%s' % sock]
    )

    # Specified port
    p3 = subprocess.Popen(
        ['jupyter-notebook', '--no-browser', '--port=%s' % TEST_PORT]
    )

    time.sleep(3)

    assert MSG_TMPL.format(DEFAULT_NOTEBOOK_PORT) in subprocess.check_output(
        ['jupyter-notebook', 'stop']
    ).decode()

    _ensure_stopped('There is currently no server running on 8888')

    assert MSG_TMPL.format(sock) in subprocess.check_output(
        ['jupyter-notebook', 'stop', sock]
    ).decode()

    assert MSG_TMPL.format(TEST_PORT) in subprocess.check_output(
        ['jupyter-notebook', 'stop', TEST_PORT]
    ).decode()

    _ensure_stopped()

    p1.wait()
    p2.wait()
    p3.wait()
