# Jupyter Notebook

[![Google Group](https://img.shields.io/badge/-Google%20Group-lightgrey.svg)](https://groups.google.com/forum/#!forum/jupyter)
[![Build Status](https://travis-ci.org/jupyter/notebook.svg?branch=master)](https://travis-ci.org/jupyter/notebook)
[![Documentation Status](https://readthedocs.org/projects/jupyter-notebook/badge/?version=latest)](https://jupyter-notebook.readthedocs.io/en/latest/?badge=latest)
                
英語版のリンク : [[English Version](http://github.com/jupyter/notebook/)]

Jupyter Notebookは、インタラクティブなWebベースのノートブック形式の環境です。

![Jupyter notebook example](resources/running_code_med.png "Jupyter notebook example")

### Jupyter Notebook, 言語に依存しないIPython Notebookの進化

Jupyter Notebookは、Project Jupyter用の言語に依存しないHTMLノートブックアプリケーションです。
2015年、Jupyter NotebookはIPythonコードベースのThe Big Split™の一部としてリリースされました。IPython3はIPython Notebookなどのユーザーの言語に依存しないコードとIPython kernel for Pythonのような特定の言語ベースのコードの機能を持ってリリースしました。
コンピューティングは多くの言語にまたがるため、Project Jupyterはこのリポジトリで言語に依存しない**Jupyter Notebook**を継続的に開発します。そして、コミュニティの助けを借りて、独自のリポジトリにある言語固有のカーネルを開発します。
[[The Big Split™ announcement](https://blog.jupyter.org/the-big-split-9d7b88a031a7)]
[[Jupyter Ascending blog post](https://blog.jupyter.org/jupyter-ascending-1bf5b362d97e)]

## インストール

[Jupyter platform, on ReadTheDocs](https://jupyter.readthedocs.io/en/latest/install.html)から、インストールドキュメントをご覧になれます。
Jupyter Notebookの発展的な使用方法に関するドキュメントは、[こちら](https://jupyter-notebook.readthedocs.io/en/latest/)をご覧ください。

ローカルへのインストールの場合、[pip](https://pip.readthedocs.io/en/stable/installing/)をインストールしていることを確認し、以下のコマンドを実行してください。

    $ pip install notebook

## 使用方法 - Jupyter Notebookの実行

### ローカルへのインストールにおける実行

以下のコマンドをを実行してください：

    $ jupyter notebook

### リモートへのインストールにおける実行

Jupyter Notebookをリモートで起動する前に、いくつかの構成が必要です。 [Notebookサーバーの実行](https://jupyter-notebook.readthedocs.io/en/stable/public_server.html)を参照してください。

## 開発用インストール

開発用インストールのセットアップ方法については、[`CONTRIBUTING.rst`](https://github.com/jupyter/notebook/blob/master/CONTRIBUTING.rst)を参照してください。

## 貢献

プロジェクトへの貢献に興味がある場合は、[`CONTRIBUTING.rst`](https://github.com/jupyter/notebook/blob/master/CONTRIBUTING.rst)をご覧ください。

## 参考

- [Project Jupyter website](https://jupyter.org)
- [Online Demo at try.jupyter.org](https://try.jupyter.org)
- [Documentation for Jupyter notebook](https://jupyter-notebook.readthedocs.io/en/latest/) [[PDF](https://media.readthedocs.org/pdf/jupyter-notebook/latest/jupyter-notebook.pdf)]
- [Documentation for Project Jupyter](https://jupyter.readthedocs.io/en/latest/index.html) [[PDF](https://media.readthedocs.org/pdf/jupyter/latest/jupyter.pdf)]
- [Issues](https://github.com/jupyter/notebook/issues)
- [Technical support - Jupyter Google Group](https://groups.google.com/forum/#!forum/jupyter)
