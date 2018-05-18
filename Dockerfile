FROM buildpack-deps:jessie

ENV PATH /usr/local/bin:$PATH

ENV LANG C.UTF-8

# runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
		tcl \
		tk \
		vim \
		mlocate \
	&& rm -rf /var/lib/apt/lists/*

ENV GPG_KEY 0D96DF4D4110E5C43FBFB17F2D347EA6AA65421D
ENV PYTHON_VERSION 3.6.3

RUN set -ex \
	&& buildDeps=' \
		dpkg-dev \
		tcl-dev \
		tk-dev \
	' \
	&& apt-get update && apt-get install -y $buildDeps --no-install-recommends && rm -rf /var/lib/apt/lists/* \
	\
	&& wget -O python.tar.xz "https://www.python.org/ftp/python/${PYTHON_VERSION%%[a-z]*}/Python-$PYTHON_VERSION.tar.xz" \
	&& wget -O python.tar.xz.asc "https://www.python.org/ftp/python/${PYTHON_VERSION%%[a-z]*}/Python-$PYTHON_VERSION.tar.xz.asc" \
	&& export GNUPGHOME="$(mktemp -d)" \
	&& gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "$GPG_KEY" \
	&& gpg --batch --verify python.tar.xz.asc python.tar.xz \
	&& rm -rf "$GNUPGHOME" python.tar.xz.asc \
	&& mkdir -p /usr/src/python \
	&& tar -xJC /usr/src/python --strip-components=1 -f python.tar.xz \
	&& rm python.tar.xz \
	\
	&& cd /usr/src/python \
	&& gnuArch="$(dpkg-architecture --query DEB_BUILD_GNU_TYPE)" \
	&& ./configure \
		--build="$gnuArch" \
		--enable-loadable-sqlite-extensions \
		--enable-shared \
		--with-system-expat \
		--with-system-ffi \
		--without-ensurepip \
	&& make -j "$(nproc)" \
	&& make install \
	&& ldconfig \
	\
	&& apt-get purge -y --auto-remove $buildDeps \
	\
	&& find /usr/local -depth \
		\( \
			\( -type d -a \( -name test -o -name tests \) \) \
			-o \
			\( -type f -a \( -name '*.pyc' -o -name '*.pyo' \) \) \
		\) -exec rm -rf '{}' + \
	&& rm -rf /usr/src/python

# make some useful symlinks that are expected to exist
RUN cd /usr/local/bin \
	&& ln -s idle3 idle \
	&& ln -s pydoc3 pydoc \
	&& ln -s python3 python \
	&& ln -s python3-config python-config

# if this is called "PIP_VERSION", pip explodes with "ValueError: invalid truth value '<VERSION>'"
ENV PYTHON_PIP_VERSION 9.0.1

RUN set -ex; \
	\
	wget -O get-pip.py 'https://bootstrap.pypa.io/get-pip.py'; \
	\
	python get-pip.py \
		--disable-pip-version-check \
		--no-cache-dir \
		"pip==$PYTHON_PIP_VERSION" \
	; \
	pip --version; \
	\
	find /usr/local -depth \
		\( \
			\( -type d -a \( -name test -o -name tests \) \) \
			-o \
			\( -type f -a \( -name '*.pyc' -o -name '*.pyo' \) \) \
		\) -exec rm -rf '{}' +; \
	rm -f get-pip.py

RUN pip install notebook
ENV PATH $PATH:/usr/local/bin/

#notebook login password : notebook
# python -c 'from notebook.auth import passwd; a=passwd();print a'
#ENV PASS sha1:49c904de3a67:387ec986ffe3ecff8c35f61508e07b8cfd957049

RUN jupyter notebook --generate-config && \
    sed -i "s/#c.NotebookApp.allow_password_change = True/c.NotebookApp.allow_password_change = True/g" /root/.jupyter/jupyter_notebook_config.py && \
    sed -i 's/#c.NotebookApp.allow_root = True/c.NotebookApp.allow_root = True/g' /root/.jupyter/jupyter_notebook_config.py && \
    sed -i "s/#c.NotebookApp.password = u''/c.NotebookApp.password = u'sha1:49c904de3a67:387ec986ffe3ecff8c35f61508e07b8cfd957049'/g" /root/.jupyter/jupyter_notebook_config.py && \
    sed -i 's/#c.NotebookApp.port\ =\ 8888/c.NotebookApp.port\ =\ 8888/g' /root/.jupyter/jupyter_notebook_config.py && \
    sed -i "s/#c.NotebookApp.ip\ =\ 'localhost'/c.NotebookApp.ip\ =\ '0.0.0.0'/g" /root/.jupyter/jupyter_notebook_config.py && \
    sed -i "s/#c.NotebookApp.allow_password_change = True/c.NotebookApp.allow_password_change = True/g" /root/.jupyter/jupyter_notebook_config.py

ENTRYPOINT ["jupyter", "notebook", "--allow-root"]