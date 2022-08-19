FROM mcr.microsoft.com/vscode/devcontainers/universal:linux

RUN curl micro.mamba.pm/install.sh | bash

COPY .devcontainer/dev-environment.yml /tmp/dev-environment.yml

RUN $(${HOME}/.local/bin/micromamba shell hook --shell=bash) && \
    ${HOME}/.local/bin/micromamba install -n base -y -f ./environment.yml

COPY .devcontainer/_dockerfile_shell.sh /usr/local/bin/_dockerfile_shell.sh

SHELL ["/usr/local/bin/_dockerfile_shell.sh"]
