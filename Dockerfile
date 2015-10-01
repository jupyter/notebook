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
        nodejs-legacy \
        npm \
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

ADD . /srv/notebook

RUN pip3 install --pre -e /srv/notebook \
 && python2 -m ipykernel.kernelspec \
 && python3 -m ipykernel.kernelspec

EXPOSE 8888
