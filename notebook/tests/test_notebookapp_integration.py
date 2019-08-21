import os
import stat
import subprocess
import time

from ipython_genutils.testing.decorators import skip_win32

from .launchnotebook import UNIXSocketNotebookTestBase
from ..utils import urlencode_unix_socket, urlencode_unix_socket_path


@skip_win32
def test_shutdown_sock_server_integration():
    sock = UNIXSocketNotebookTestBase.sock
    url = urlencode_unix_socket(sock)
    encoded_sock_path = urlencode_unix_socket_path(sock)

    p = subprocess.Popen(
        ['jupyter', 'notebook', '--no-browser', '--sock=%s' % sock],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )

    for line in iter(p.stderr.readline, b''):
        if url.encode() in line:
            complete = True
            break

    assert complete, 'did not find socket URL in stdout when launching notebook'

    assert encoded_sock_path.encode() in subprocess.check_output(['jupyter', 'notebook', 'list'])

    # Ensure default umask is properly applied.
    assert stat.S_IMODE(os.lstat(sock).st_mode) == 0o600

    subprocess.check_output(['jupyter', 'notebook', 'stop', sock])

    assert encoded_sock_path.encode() not in subprocess.check_output(['jupyter', 'notebook', 'list'])

    p.wait()
