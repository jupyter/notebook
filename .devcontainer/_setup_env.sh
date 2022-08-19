#!/bin/bash

source ${HOME}/.bashrc
micromamba config append channels conda-forge
micromamba install -n base -y -f ./environment.yml
