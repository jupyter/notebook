# Installs Jupyter Notebook and IPython kernel from the current branch
# Another Docker container should inherit with `FROM jupyter/notebook`
# to run actual services.

FROM ubuntu:14.04

MAINTAINER Project Jupyter <jupyter@googlegroups.com>

ENV DEBIAN_FRONTEND noninteractive

# Not essential, but wise to set the lang
# Note: Users with other languages should set this in their derivative image
ENV LANGUAGE en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LC_ALL en_US.UTF-8

# Python binary dependencies, developer tools
RUN apt-get update && apt-get install -y -q \
    build-essential \
    curl \
    language-pack-en \
    make \
    gcc \
    zlib1g-dev \
    git \
    python \
    python-dev \
    python3-dev \
    python-sphinx \
    python3-sphinx \
    libzmq3-dev \
    sqlite3 \
    libsqlite3-dev \
    pandoc \
    libcurl4-openssl-dev \
    nodejs \
    nodejs-legacy \
    npm

# Install the recent pip release
RUN curl -O https://bootstrap.pypa.io/get-pip.py \
 && python2 get-pip.py \
 && python3 get-pip.py \
 && rm get-pip.py

RUN pip2 install ipykernel
RUN pip3 install ipykernel

RUN mkdir -p /srv/
ADD . /srv/notebook
WORKDIR /srv/notebook/

RUN pip3 install --pre -e .

# install kernels
RUN python2 -m ipykernel.kernelspec
RUN python3 -m ipykernel.kernelspec

EXPOSE 8888
