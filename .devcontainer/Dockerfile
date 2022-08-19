FROM mcr.microsoft.com/vscode/devcontainers/universal:linux

RUN curl micro.mamba.pm/install.sh | bash

COPY .devcontainer/dev-environment.yml /tmp/dev-environment.yml

RUN micromamba install -n base -y -f ./environment.yml
