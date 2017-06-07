Hello Jovyans, 


### TL;DR:

Please backup your files, install the notebook 4.1-beta with 

```
python -m pip install notebook --pre --upgrade
```

and then send us feedback.

### Longer

We are happy to release a beta of the latest version of the `notebook`. We are
hoping to release the final version before the end of the year.   We seek your 
help in testing the latest version of the notebook and reporting any bugs or 
incompatibilities with version 4.0 that may have sneaked into this release. 

Unlike other minor releases, we have added a few new features that we would like 
you to test and give us feedback on:

##### Multiselection

`Shift-J`, `Shift-K` (as well as `Shift-Up`, `Shift-Down`) allows you to select
multiple cells. Most actions you execute (run cell, copy, paste, delete, etc.) 
will apply to all of the cells in the **selection**. Please test this feature 
thoroughly. It may be that not everything will work as expected.

##### Find and Replace 

A new find and replace dialog has been added.  It is accessible either in the 
*toolbar* or by using the shortcut `F` in command mode.  It supports Javascript 
regular expressions and a **preview** of what will be replaced.

##### Command Palette

`Ctrl-Shift-P` (`Cmd-Shift-P` on Mac) opens the command palette, which enables 
you to search through all of the actions the notebook has defined, including 
the ones **not visible** in the menus or toolbar.  It supports a crude form of
fuzzy-matching which will be improved in later versions.

##### Securing public server

If you are running your notebook locally, you use an SSL certificate and a 
notebook password.  The notebook now comes shipped with a script to help you set 
this up on unix machines. 

```bash
$ python tools/secure_notebook.py
```

##### "Restart kernel and run all" menu item

An often requested feature which is now included in the notebook.


### Install and test it.

This release also contains loads of bugfixes, other small improvements, and new 
configuration options. You can see the [changelog](http://jupyter-notebook.readthedocs.org/en/latest/changelog.html) 
here.  If we've missed anything in this announcement or the docs included with 
the beta, please report it so we can make sure it's included prior to the 4.1 
final release.

Later, there will be a longer blog post for the formal announcement of 4.1, with 
more details about the new features.  Feel free too report any **surprising**[1] 
behaviors and we **always** welcome first impressions regarding the new features, 
as well as feedback from long term users.

(Also you still have a few days to apply for the Postdoc positions at UC
Berkeley)

Enjoy this pre-release,

Cheers, 
-- 
M

[1]: We also accept bug reports that say "I love this new feature, thank you".
