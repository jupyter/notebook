FROM mcr.microsoft.com/vscode/devcontainers/universal:linux

RUN conda update -n base -c defaults conda && \
    conda env create -f .devcontainer/dev-environment.yml
