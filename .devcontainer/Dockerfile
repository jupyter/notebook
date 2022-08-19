FROM mcr.microsoft.com/vscode/devcontainers/universal:linux

COPY .devcontainer/dev-environment.yml /tmp/dev-environment.yml

RUN conda env create -f /tmp/devcontainer/dev-environment.yml
