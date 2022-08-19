#!/usr/bin/env bash

set -ef -o pipefail

micromamba activate

exec bash -o pipefail -c "$@"