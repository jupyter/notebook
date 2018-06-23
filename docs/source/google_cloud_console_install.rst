Installing on Google Cloud Shell in Preview Mode
------------------------------------------------

`GoogleCloudConsole https://console.cloud.google.com`_  provides a free shell and temporay vm to run on that will be disposed of after you leave,
there is a `preview https://cloud.google.com/shell/docs/using-web-preview`_ mode that you can use to access a web port. 

First you want to install nodejs and link it to the node name that is expected by the bower install

   sudo apt-get install nodejs
   sudo ln -s /usr/bin/nodejs  /usr/bin/node

We will install from source

   git clone https://github.com/jupyter/notebook.git  
   cd notebook/
   pip3 install -e . --user  
   
Now generate a configuration

   ~/.local/bin/jupyter notebook --generate-config

And edit it :

    emacs   ~/.jupyter/jupyter_notebook_config.py
    
and set the following settings

    c.NotebookApp.port = 8080
    c.NotebookApp.ip = '0.0.0.0'
    c.NotebookApp.allow_origin = '*'

Now you can launch the notebook

   ~/.local/bin/jupyter notebook
   
After that you start the preview mode `preview https://cloud.google.com/shell/docs/using-web-preview`_ mode by clicking on the preview icon 
.. image:: https://cloud.google.com/shell/docs/images/web-preview-button.png 
on the top right of your shell window. Set the port 8080 and click start.
  
Note that there is a `Colab https://colab.research.google.com/notebooks/` site hosted by google as well that allows you to host notebooks.
Also I have found other provides of Juypter notebooks online 
`https://jupyter.org/try`
`https://notebooks.azure.com/`
`https://cocalc.com/projects?session=default`
`https://mybinder.org/`

