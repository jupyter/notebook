FROM mcr.microsoft.com/vscode/devcontainers/universal:linux

RUN curl micro.mamba.pm/install.sh | bash

COPY .devcontainer/dev-environment.yml /tmp/dev-environment.yml

COPY .devcontainer/_setup_env.sh /tmp/_setup_env.sh

RUN chmod +x /tmp/_setup_env.sh && /bin/bash /tmp/_setup_env.sh

COPY .devcontainer/_dockerfile_shell.sh /usr/local/bin/_dockerfile_shell.sh

SHELL ["/usr/local/bin/_dockerfile_shell.sh"]
