FROM ghcr.io/mamba-org/micromamba-devcontainer:git-e56c5fc

# Ensure that all users have read-write access to all files created in the subsequent commands.
ARG DOCKERFILE_UMASK=0000

# Install the Conda packages.
COPY --chown=$MAMBA_USER:$MAMBA_USER .devcontainer/environment.yml /tmp/dev-conda-environment.yaml
RUN : \
    # Configure Conda to use the conda-forge channel.
    && micromamba config append channels conda-forge \
    && micromamba install -y -f /tmp/dev-conda-environment.yaml \
    && micromamba clean --all --yes \
    ;

# Activate the conda environment for the Dockerfile.
# <https://github.com/mamba-org/micromamba-docker#running-commands-in-dockerfile-within-the-conda-environment>
ARG MAMBA_DOCKERFILE_ACTIVATE=1

# Create and set the workspace folder
ARG CONTAINER_WORKSPACE_FOLDER=/workspaces/default-workspace-folder
RUN mkdir -p "${CONTAINER_WORKSPACE_FOLDER}"
WORKDIR "${CONTAINER_WORKSPACE_FOLDER}"

COPY --chown=$MAMBA_USER:$MAMBA_USER . ./
