FROM n3uz/debian-python2.7.14-pip9
RUN pip install notebook
ENV PATH $PATH:/usr/local/bin/

#notebook login password : notebook
#ENV PASS sha1:49c904de3a67:387ec986ffe3ecff8c35f61508e07b8cfd957049

RUN jupyter notebook --generate-config && \
    sed -i "s/#c.NotebookApp.allow_password_change = True/c.NotebookApp.allow_password_change = True/g" /root/.jupyter/jupyter_notebook_config.py && \
    sed -i 's/#c.NotebookApp.allow_root = True/c.NotebookApp.allow_root = True/g' /root/.jupyter/jupyter_notebook_config.py && \
    sed -i "s/#c.NotebookApp.password = u''/c.NotebookApp.password = u'sha1:49c904de3a67:387ec986ffe3ecff8c35f61508e07b8cfd957049'/g" /root/.jupyter/jupyter_notebook_config.py && \
    sed -i 's/#c.NotebookApp.port\ =\ 8888/c.NotebookApp.port\ =\ 8888/g' /root/.jupyter/jupyter_notebook_config.py && \
    sed -i "s/#c.NotebookApp.ip\ =\ 'localhost'/c.NotebookApp.ip\ =\ '0.0.0.0'/g" /root/.jupyter/jupyter_notebook_config.py && \
    sed -i "s/#c.NotebookApp.allow_password_change = True/c.NotebookApp.allow_password_change = True/g" /root/.jupyter/jupyter_notebook_config.py

ENTRYPOINT ["jupyter", "notebook", "--allow-root"]