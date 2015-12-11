Hello Jovyans, 


### TL;DR:

Please backup your files, then install notebook 4.1-beta with 

```
python -m pip install notebook --pre --upgrade
```

And send us your feedback.

### Longer

We are happy to start a beta of the latest version of the `notebook`. We are
hopping to release the final version before 2016, so we seek your help to test
the latest version, and complain rapidly of any critical bugs or
incompatibility with 4.0 that would have sneaked into this version. 

Unlike other minor releases we have a few new features we would like you to
test and give feedback on:

##### Multiselection:

`Shift-J`,`Shift-K` (as well as Shift-Up/Down) can allow you to select multiple
cells. Most action you execute (run cell, copy, paste, delete) will apply to
the **selection**. Please test that thoroughly. Not all the things will work,
but we don't want you to lose data.

##### Find and Replace 

Either in the *toolbar** of using the shortcut `f` in command mode. It supports
Javascript regular expression and a **preview**.

##### Command Palette

Ctrl-Shift-P (Cmd-Shift-P on Mac) bring a command palette, to search through
all commands (including these **not included** in the menus and toolbar. 
Fuzzy-Matching is crude and can be improved, we know. Please test also. 

##### Securing public server. 

If you are running your notebook locally, you should be using an SSL
certificate and a password. We know have a script to help you set this up on
unix machines. 


```bash
$ python tools/secure_notebook.py
```

##### Restart kernel and run all Menu.

Often requested feedback (now available !)


### Install and test it.

That should be about it for the package, with load oaf bugfixes, and other
small improvement and configuration options. You can see the
[changelog](http://jupyter-notebook.readthedocs.org/en/latest/changelog.html)
here, we would appreciate any reminder of any thing we missed in this changelog
or in the docs before the release of 4.1 to be sure everything goes smoothly. 


We'll do a longer blog post for the annouce of 4.1 with more details on these
feature later. I stay vague on purpose. Feel free too report any
**surprising**[1] behavior, and we **always** welcome first impression on
features, as well as feedback from users that have used it longer. 

(Also you still have a few days to apply for the Postdocs positions at UC
Berkeley)

Enjoy this pre-release,

Cheers, 
-- 
M

[1]: We also accept bug report that just say "I love this new feature thank you".



