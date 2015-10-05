# Installs Jupyter Notebook and IPython kernel from the current branch
# Another Docker container should inherit with `FROM jupyter/notebook`
# to run actual services.

FROM ubuntu:14.04

MAINTAINER Project Jupyter <jupyter@googlegroups.com>

# Not essential, but wise to set the lang
# Note: Users with other languages should set this in their derivative image
ENV LANGUAGE en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LC_ALL en_US.UTF-8

# Python binary and source dependencies
RUN apt-get update -qq \
 && DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends \
        build-essential \
        ca-certificates \
        curl \
        git \
        language-pack-en \
        libcurl4-openssl-dev \
        libsqlite3-dev \
        libzmq3-dev \
        pandoc \
        python \
        python-dev \
        python3-dev \
        sqlite3 \
        zlib1g-dev \
 && rm -rf /var/lib/apt/lists/* \
 \
 `# Install the recent pip release` \
 && curl -O https://bootstrap.pypa.io/get-pip.py \
 && python2 get-pip.py \
 && python3 get-pip.py \
 && rm get-pip.py \
 \
 && pip2 --no-cache-dir install ipykernel \
 && pip3 --no-cache-dir install ipykernel

ADD . /usr/src/jupyter-notebook

RUN ln -s /usr/src/jupyter-notebook/scripts/lxc-launcher.sh /launch.sh \
 \
 && BUILD_DEPS="nodejs-legacy npm" \
 && apt-get update -qq \
 && DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends $BUILD_DEPS \
 \
 && pip3 install --no-cache-dir --pre -e /usr/src/jupyter-notebook \
 \
 && apt-get purge -y --auto-remove \
       -o APT::AutoRemove::RecommendsImportant=false -o APT::AutoRemove::SuggestsImportant=false $BUILD_DEPS \
 && rm -rf /var/lib/apt/lists/* \
 \
 && python2 -m ipykernel.kernelspec \
 && python3 -m ipykernel.kernelspec

ENTRYPOINT /launch.sh

EXPOSE 8888
