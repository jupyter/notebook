#!/bin/bash

# A wrapper script for running Jupyter notebook in a lxc-container that
# addresses two issues:
# - IPython kernels constantly crash when run with PID == 1
# - send signals to the process for a proper shutdown when the container
#   receives a TERM signal

_terminate() {
    kill -SIGINT $PID
    kill -SIGINT $PID
}

trap _terminate SIGTERM
trap _terminate SIGINT

jupyter notebook --port 8888 --ip=* "${@}" &
PID=$!

wait $PID
exit $?
