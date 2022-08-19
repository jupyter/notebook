FROM mambaorg/micromamba:0.25

USER root

RUN DEBIAN_FRONTEND=noninteractive apt-get update && apt-get install -y --no-install-recommends --reinstall \
    git \
    htop \
    curl \
    wget \
    jq \
    && rm -rf /var/lib/apt/lists/*

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

COPY --chown=$MAMBA_USER:$MAMBA_USER . ./
