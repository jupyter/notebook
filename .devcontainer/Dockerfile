ARG BASE_IMAGE=mambaorg/micromamba:0.25

ARG DEV_WORK_DIR=/workspaces

FROM ${BASE_IMAGE}

USER root

# Install some useful OS packages
RUN DEBIAN_FRONTEND=noninteractive apt-get update && apt-get install -y --no-install-recommends --reinstall \
    ca-certificates \
    coreutils \
    sudo \
    less \
    watch \
    git \
    patch \
    nano \
    vim \
    jq \
    file \
    htop \
    zip \
    unzip \
    curl \
    wget \
    #
    && rm -rf /var/lib/apt/lists/*

RUN : \
    # Grant sudo to the user.
    && usermod -aG sudo "${MAMBA_USER}" \
    && echo "%sudo   ALL=(ALL:ALL) NOPASSWD:ALL" > /etc/sudoers.d/grant-to-sudo-group \
    ;

# Make sure we own the working directory.
ARG DEV_WORK_DIR
RUN : \
    && mkdir -p "${DEV_WORK_DIR}" \
    && chown "$MAMBA_USER:$MAMBA_USER" "${DEV_WORK_DIR}"

# Set the working directory.
ENV DEV_WORK_DIR="${DEV_WORK_DIR}"
WORKDIR "${DEV_WORK_DIR}"

USER $MAMBA_USER

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
