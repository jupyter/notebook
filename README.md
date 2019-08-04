## Table Of Contents:

* [About This Repository](#about)
* [Setting Up a Development Environment](#getting-started)
  * [Dependencies Installation: Node.js & npm](#dependencies-installation)
  * [Installing Jupyter Notebook](#installing-jupyter-notebook)
* [Contributing To Jupyter Notebook](#contributing)
  * [Changing the default dashboard](#changing)
  * [Editing Menu bar](#editing)
  * [Replacing the "LogOut" Button with a "Quit" Button](#quit-button)
  * [Adding a "Publish" Button Beside the "Quit" Button](#publish-button)
  * [Styling Jupyter Notebook](#styling)
 
<a name="about"></a>
## About This Repository:

Hey there! In This **forked** repository are few contributions to Jupyter Notebook's UI to accommodate to the modifications underneath:

* Redirecting the user to an existing notebook instead of the default dashboard.
* Deleting some sub-items in the menu bar in the notebook file.
* Replacing logout button with a quit button.
* Adding a publishing button leftside the quit button.

**All the modified files contain heavily documented code.**

<a name="getting-started"></a>
## Setting Up a Development Environment:
<a name="dependencies-installation"></a>
#### Dependencies Installation: Node.js & npm

If you are using conda:

	conda install -c conda-forge nodejs
	
If you use Homebrew on Mac OS X:

	brew install node
	
If you're using Linux:

You'll need to install both Ruby, GCC and Homebrew as prerequisites.

If you're using **Ubuntu** or **Debian-based** Linux distributions:

	sudo apt-get install build-essential curl git m4 ruby texinfo libbz2-dev libcurl4-openssl-dev libexpat-dev libncurses-dev zlib1g-dev
	
If you're using **Fedora** based Linux distributions: 

	sudo yum groupinstall 'Development Tools' && sudo yum install curl git m4 ruby texinfo bzip2-devel curl-devel expat-devel ncurses-devel zlib-devel
	
Once Linuxbrew/Homebrew is installed, you’ll need add the following 3 lines to your `.bashrc` or `.zshrc` file:

	 export PATH="$HOME/.linuxbrew/bin:$PATH"
	 export MANPATH="$HOME/.linuxbrew/share/man:$MANPATH"
	 export INFOPATH="$HOME/.linuxbrew/share/info:$INFOPATH"
	
After installion of prerequisites successfully finish, now you're capable of installing Nodejs and npm.

	brew install node
	
You can test it out through your terminal:

	node -v
	npm -v
	
<img src="https://i.ibb.co/nn5sFTz/testlux.png" /> 

If you're using Windows:

* Download the Windows installer from the [Nodes.js®](https://nodejs.org/en/download/) web site.
* Run the installer
* Follow the prompts in the installer (Accept the license agreement, click the NEXT button a bunch of times and accept the default installation settings).

<img src="https://i.ibb.co/m6nHD14/nodejs.png"/> 

You can test it out through your powershell:

	node -v
	npm -v
	
	
<img src="https://i.ibb.co/GTcF7bR/testwin.png"/> 

<a name="installing-jupyter-notebook"></a>
#### Installing Jupyter Notebook

	pip install --upgrade setuptools pip
	git clone https://github.com/AlyMuhammadAly/notebook.git
	cd notebook
	pip install -e .
	
Once installation done successfully, now you can launch the master branch of Jupyter Notebook form any directory in your system.

	jupyter notebook

<a name="contributing"></a>
## Contributing To Jupyter Notebook:
Underneath you'll find every modification is associated with the necessary file(s) path(s).

<a name="changing"></a>
#### Changing the default dashboard:

Changing the default dashboard to a new **existing** notebook.

	notebook/notebook/notebookapp.py
	

<img src="https://i.ibb.co/K5h0PCP/new.png"/> 

<a name="editing"></a>
#### Editing Menu bar:
	
Removing few sub-items from the menu bar.

	notebook/notebook/templates/notebook.html 
	notebook/notebook/static/notebook/js/menubar.js
	notebook/notebook/static/notebook/less/style.less
	 
	
Modifying the **file** drop down menu:
	
<img src="https://i.ibb.co/25bTbrW/file.png"/> 

Modifying the **kernel** drop down menu:
	
<img src="https://i.ibb.co/YRSccTT/kernel.png"/> 

Removing the **Help** menu item:

<img src="https://i.ibb.co/SXCysNk/help.png"/> 

<a name="quit-button"></a>	
#### Replacing the "LogOut" Button with a "Quit" Button:

Removing the upper right **logout** button.

	notebook/notebook/templates/page.html
		
<img src="https://i.ibb.co/6nVmhYr/nologout.png"  /> 

Adding the **Quit** button.

	notebook/notebook/templates/notebook.html
	
<img src="https://i.ibb.co/kyGCqG1/quit.png"/> 

<a name="publish-button"></a>
#### Adding a "Publish" Button:

	notebook/notebook/templates/notebook.html
	notebook/notebook/templates/override.css

<img src="https://i.ibb.co/vcpKMRN/buttons.png" /> 

<a name="styling"></a>
#### Styling Jupyter Notebooks:

You can download some cool stylings from [here](https://github.com/dunovank/jupyter-themes/tree/master/jupyterthemes/styles/compiled). Paste & save the css code in `custom.css`, then run `jupyter notebook` in the terminal to see the new stylings in action.
	
	notebook/notebook/static/custom/custom.css

	
	









