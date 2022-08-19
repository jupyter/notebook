#!/bin/bash

curl micro.mamba.pm/install.sh | bash
source ${HOME}/.bashrc
micromamba config append channels conda-forge
micromamba install -n base -y -f /tmp/dev-environment.yml
