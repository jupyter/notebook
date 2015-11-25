#!/usr/bin/env python

from notebook.auth import passwd
from traitlets.config.loader import JSONFileConfigLoader, ConfigFileNotFound
import six
from jupyter_core.paths import jupyter_config_dir
from traitlets.config import Config



from OpenSSL import crypto, SSL
from socket import gethostname
from pprint import pprint
from time import gmtime, mktime
from os.path import exists, join

import io
import os
import json


def create_self_signed_cert(cert_dir, keyfile, certfiile):
    """
    If datacard.crt and datacard.key don't exist in cert_dir, create a new
    self-signed cert and keypair and write them into that directory.
    """

    if not exists(join(cert_dir, certfiile)) \
            or not exists(join(cert_dir, keyfile)):

        # create a key pair
        k = crypto.PKey()
        k.generate_key(crypto.TYPE_RSA, 1024)

        # create a self-signed cert
        cert = crypto.X509()
        cert.get_subject().C = "US"
        cert.get_subject().ST = "Jupyter notebook self-signed certificate"
        cert.get_subject().L = "Jupyter notebook self-signed certificate"
        cert.get_subject().O = "Jupyter notebook self-signed certificate"
        cert.get_subject().OU = "my organization"
        cert.get_subject().CN = "Jupyter notebook self-signed certificate"
        cert.set_serial_number(1000)
        cert.gmtime_adj_notBefore(0)
        cert.gmtime_adj_notAfter(365*24*60*60)
        cert.set_issuer(cert.get_subject())
        cert.set_pubkey(k)
        cert.sign(k, 'sha256')

        with io.open(join(cert_dir, certfile), "wt") as f:
            f.write(crypto.dump_certificate(crypto.FILETYPE_PEM, cert).decode('utf8'))
        with io.open(join(cert_dir, keyfile), "wt") as f:
            f.write(crypto.dump_privatekey(crypto.FILETYPE_PEM, k).decode('utf8'))


if __name__ == '__main__':
    print("This guide you into securing your notebook server")
    print("first choose a password.")
    pw = passwd()
    print("We will store your password encrypted in the notebook configuration file: ")
    print(pw)

    loader = JSONFileConfigLoader('jupyter_notebook_config.json', jupyter_config_dir())
    try:
        config = loader.load_config()
    except ConfigFileNotFound:
        config = Config()

    config.NotebookApp.password = pw

    with io.open(os.path.join(jupyter_config_dir(), 'jupyter_notebook_config.json'), 'w') as f:
        f.write(six.u(json.dumps(config, indent=2)))

    print('... done')
    print()

    print("Now let's generate self-signed certificates to secure your connexion.")
    print("where should the certificate live?")
    location = input('path [~/.ssh]: ')
    if not location.strip():
        location = os.path.expanduser('~/.ssh')
    keyfile = input('keyfile name [jupyter_server.key]: ')
    if not keyfile.strip():
        keyfile = 'jupyter_server.key'
    certfile = input('certfile name [jupyter_server.crt]: ')
    if not certfile.strip():
        certfile = 'jupyter_server.crt'

    create_self_signed_cert(location, keyfile, certfile)

    fullkey = os.path.join(location, keyfile)
    fullcrt = os.path.join(location, certfile)

    config.NotebookApp.certfile = fullcrt
    config.NotebookApp.keyfile = fullkey

    with io.open(os.path.join(jupyter_config_dir(), 'jupyter_notebook_config.json'), 'w') as f:
        f.write(six.u(json.dumps(config, indent=2)))



