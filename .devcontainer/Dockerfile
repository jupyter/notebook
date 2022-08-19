FROM mcr.microsoft.com/vscode/devcontainers/universal:linux

COPY .devcontainer/dev-environment.yaml /tmp/dev-environment.yaml

RUN conda env create -f /tmp/devcontainer/dev-environment.yml
