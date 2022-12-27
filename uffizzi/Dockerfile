FROM python:3

WORKDIR /app

COPY . .

RUN apt update

RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && apt-get install -y nodejs


RUN pip install -e /app


ENTRYPOINT [ "jupyter"]

CMD [\
    "notebook", \
    "--allow-root", \
    "--NotebookApp.allow_origin=*", \
    "--NotebookApp.allow_remote_access=1", \
    "--ip='*'", \
    "--NotebookApp.token=''", \
    "--NotebookApp.password=''"\
    ]