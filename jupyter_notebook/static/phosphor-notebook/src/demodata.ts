import nbformat = require("./nbformat");
  export var notebook: nbformat.Notebook = {
     "cells": [
      {
       "cell_type": "code",
       "execution_count": null,
       "metadata": {
        "collapsed": false
       },
       "outputs": [],
       "source": [
        "import sys\n",
        "\n",
        "from IPython.nbconvert.exporters import HTMLExporter\n",
        "from IPython.nbconvert.exporters import TemplateExporter\n",
        "from IPython.config import Config\n",
        "import io\n",
        "\n",
        "basic_config = Config({\n",
        "        \"HTMLExporter\":{\"template_file\":\"basic\"},\n",
        "        'NbConvertBase': {'display_data_priority' : \n",
        "                ['text/html', 'text/markdown', 'application/pdf', 'image/svg+xml', 'text/latex', 'image/png', 'image/jpeg', 'text/plain']\n",
        "                    }\n",
        "    })\n",
        "\n",
        "\n",
        "# for config in (basic_config, {}):\n",
        "#     with io.open('Untitled.ipynb','r') as f:\n",
        "#         ex = HTMLExporter(config=config)\n",
        "#         html, extra = ex.from_file(f)\n",
        "#         print('-------')\n",
        "#         print(html[:40]+'...')"
       ]
      },
      {
       "cell_type": "code",
       "execution_count": 1,
       "metadata": {
        "collapsed": false
       },
       "outputs": [
        {
         "name": "stderr",
         "output_type": "stream",
         "text": [
          "/Users/bussonniermatthias/ipython/IPython/kernel/__init__.py:10: UserWarning: The `IPython.kernel` package has been deprecated. You should import from ipython_kernel or jupyter_client instead.\n",
          "  warn(\"The `IPython.kernel` package has been deprecated. \"\n"
         ]
        }
       ],
       "source": [
        "%matplotlib inline"
       ]
      },
      {
       "cell_type": "code",
       "execution_count": 2,
       "metadata": {
        "collapsed": true
       },
       "outputs": [],
       "source": [
        "import matplotlib.pyplot as plt"
       ]
      },
      {
       "cell_type": "code",
       "execution_count": 4,
       "metadata": {
        "collapsed": false
       },
       "outputs": [
        {
         "data": {
          "text/plain": [
           "[<matplotlib.lines.Line2D at 0x105298eb8>]"
          ]
         },
         "execution_count": 4,
         "metadata": {},
         "output_type": "execute_result"
        },
        {
         "data": {
          "image/png": "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\neiDj6NwAAAAASUVORK5CYII=\n",
          "text/plain": [
           "<matplotlib.figure.Figure at 0x10519c860>"
          ]
         },
         "metadata": {},
         "output_type": "display_data"
        }
       ],
       "source": [
        "plt.plot(range(10),'ro-')"
       ]
      },
      {
       "cell_type": "code",
       "execution_count": null,
       "metadata": {
        "collapsed": false
       },
       "outputs": [],
       "source": [
        "from IPython.display import HTML, display\n",
        "with io.open('Untitled.ipynb','r') as f:\n",
        "    ex = HTMLExporter(config=basic_config)\n",
        "    html, extra = ex.from_file(f)\n",
        "    display(HTML(html))\n",
        "    "
       ]
      },
      {
       "cell_type": "code",
       "execution_count": null,
       "metadata": {
        "collapsed": false
       },
       "outputs": [],
       "source": [
        "class TestObj(object):\n",
        "    \n",
        "    def _repr_html_(self):\n",
        "        return 'I Am HTML'\n",
        "    \n",
        "    def _repr_javascript_(self):\n",
        "        return  \"alert('I haz javascript')\"\n",
        "    \n",
        "    def __repr__(self):\n",
        "        return 'me text'\n",
        "    \n",
        "    \n",
        "TestObj()"
       ]
      },
      {
       "cell_type": "code",
       "execution_count": null,
       "metadata": {
        "collapsed": false
       },
       "outputs": [],
       "source": [
        "from IPython.display import HTML"
       ]
      },
      {
       "cell_type": "code",
       "execution_count": null,
       "metadata": {
        "collapsed": false
       },
       "outputs": [],
       "source": [
        "import unicodedata\n",
        "unicodedata??"
       ]
      },
      {
       "cell_type": "code",
       "execution_count": null,
       "metadata": {
        "collapsed": false
       },
       "outputs": [],
       "source": [
        "1+1"
       ]
      },
      {
       "cell_type": "code",
       "execution_count": null,
       "metadata": {
        "collapsed": true
       },
       "outputs": [],
       "source": []
      },
      {
       "cell_type": "code",
       "execution_count": null,
       "metadata": {
        "collapsed": false
       },
       "outputs": [],
       "source": [
        "β"
       ]
      },
      {
       "cell_type": "code",
       "execution_count": 17,
       "metadata": {
        "collapsed": true
       },
       "outputs": [],
       "source": [
        "Ⅰ = 1\n",
        "Ⅱ = 2\n",
        "Ⅲ = 3\n",
        "Ⅳ = 4 \n",
        "Ⅴ = 5\n",
        "Ⅵ = 6\n",
        "Ⅶ = 7\n",
        "Ⅷ = 8\n",
        "Ⅸ = 9\n",
        "Ⅹ = 10\n"
       ]
      },
      {
       "cell_type": "code",
       "execution_count": null,
       "metadata": {
        "collapsed": true
       },
       "outputs": [],
       "source": []
      },
      {
       "cell_type": "code",
       "execution_count": 11,
       "metadata": {
        "collapsed": false
       },
       "outputs": [
        {
         "ename": "SyntaxError",
         "evalue": "unexpected character after line continuation character (<ipython-input-11-2934de42d8f7>, line 1)",
         "output_type": "error",
         "traceback": [
          "\u001b[0;36m  File \u001b[0;32m\"<ipython-input-11-2934de42d8f7>\"\u001b[0;36m, line \u001b[0;32m1\u001b[0m\n\u001b[0;31m    \\NG\u001b[0m\n\u001b[0m       ^\u001b[0m\n\u001b[0;31mSyntaxError\u001b[0m\u001b[0;31m:\u001b[0m unexpected character after line continuation character\n"
         ]
        }
       ],
       "source": [
        "\\n"
       ]
      },
      {
       "cell_type": "code",
       "execution_count": 16,
       "metadata": {
        "collapsed": false
       },
       "outputs": [
        {
         "name": "stdout",
         "output_type": "stream",
         "text": [
          "fjqyJMQVWY"
         ]
        }
       ],
       "source": [
        "ip = get_ipython()\n",
        "import string\n",
        "for letter in string.ascii_letters:\n",
        "    name, matches = ip.complete('\\\\'+letter)\n",
        "    #if len(matches) == 1:\n",
        "        #print(len(matches),name, matches[0])\n",
        "    if len(matches) == 0:\n",
        "        print(letter,end='')\n"
       ]
      },
      {
       "cell_type": "code",
       "execution_count": null,
       "metadata": {
        "collapsed": true
       },
       "outputs": [],
       "source": []
      }
     ],
     "metadata": {
      "kernelspec": {
       "display_name": "Python 3",
       "language": "python",
       "name": "python3"
      },
      "language_info": {
       "codemirror_mode": {
        "name": "ipython",
        "version": 3
       },
       "file_extension": ".py",
       "mimetype": "text/x-python",
       "name": "python",
       "nbconvert_exporter": "python",
       "pygments_lexer": "ipython3",
       "version": "3.5.0a1+"
      }
     },
     "nbformat": 4,
     "nbformat_minor": 0
    }