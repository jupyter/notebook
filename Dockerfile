# Installs Jupyter Notebook and IPython kernel from the current branch
# Another Docker container should inherit with `FROM jupyter/notebook`
# to run actual services.

FROM ubuntu:14.04

MAINTAINER Project Jupyter <jupyter@googlegroups.com>

ENV DEBIAN_FRONTEND noninteractive

# Not essential, but wise to set the lang
# Note: Users with other languages should set this in their derivative image
RUN apt-get update && apt-get install -y language-pack-en
ENV LANGUAGE en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LC_ALL en_US.UTF-8

RUN locale-gen en_US.UTF-8
RUN dpkg-reconfigure locales

# Python binary dependencies, developer tools
RUN apt-get update && apt-get install -y -q \
    build-essential \
    make \
    gcc \
    zlib1g-dev \
    git \
    python \
    python-dev \
    python-pip \
    python3-dev \
    python3-pip \
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

RUN pip2 install --upgrade setuptools pip
RUN pip3 install --upgrade setuptools pip

RUN mkdir -p /srv/
WORKDIR /srv/
RUN pip3 install ipython

ADD . /srv/notebook
WORKDIR /srv/notebook/
RUN chmod -R +rX /srv/notebook

RUN pip3 install --pre -e .[test]

# install kernels
RUN python2 -m ipykernel.kernelspec
RUN python3 -m ipykernel.kernelspec

WORKDIR /tmp/

RUN nosetests notebook
