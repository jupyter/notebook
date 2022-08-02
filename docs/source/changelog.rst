.. _changelog:

Changelog
=========

A summary of changes in the Jupyter notebook.
For more detailed information, see
`GitHub <https://github.com/jupyter/notebook>`__.

.. tip::

     Use ``pip install notebook --upgrade`` or ``conda upgrade notebook`` to
     upgrade to the latest release.

.. we push for pip 9+ or it will break for Python 2 users when IPython 6 is out.

We strongly recommend that you upgrade pip to version 9+ of pip before upgrading ``notebook``.

.. tip::

    Use ``pip install pip --upgrade`` to upgrade pip. Check pip version with
    ``pip --version``.

.. _release-5.7.14a0:

5.7.14a0
--------

- Update JQuery dependency to version 3.6.0
- Pin jinja2 <= 3.0.0
- Pin jupyter_client < 7.0.0
- Update versioning mechanism

.. _release-5.7.9:

5.7.9
------

- Update JQuery dependency to version 3.4.1 to fix security vulnerability (CVE-2019-11358)
- Update from preact to React

.. _release-5.7.8:

5.7.8
-----

- Fix regression in restarting kernels in 5.7.5.
  The restart handler would return before restart was completed.
- Further improve compatibility with tornado 6 with improved
  checks for when websockets are closed.
- Fix regression in 5.7.6 on Windows where .js files could have the wrong mime-type.
- Fix Open Redirect vulnerability (CVE-2019-10255)
  where certain malicious URLs could redirect from the Jupyter login page
  to a malicious site after a successful login.
  5.7.7 contained only a partial fix for this issue.

.. _release-5.7.6:

5.7.6
-----

5.7.6 contains a security fix for a cross-site inclusion (XSSI) vulnerability (CVE-2019–9644),
where files at a known URL could be included in a page from an unauthorized website if the user is logged into a Jupyter server.
The fix involves setting the ``X-Content-Type-Options: nosniff``
header, and applying CSRF checks previously on all non-GET
API requests to GET requests to API endpoints and the /files/ endpoint.

The attacking page is able to access some contents of files when using Internet Explorer through script errors,
but this has not been demonstrated with other browsers.

.. _release-5.7.5:

5.7.5
-----

- Fix compatibility with tornado 6 (:ghpull:`4392`, :ghpull:`4449`).
- Fix opening integer filedescriptor during startup on Python 2 (:ghpull:`4349`)
- Fix compatibility with asynchronous `KernelManager.restart_kernel` methods (:ghpull:`4412`)

.. _release-5.7.4:

5.7.4
-----

5.7.4 fixes a bug introduced in 5.7.3, in which the ``list_running_servers()``
function attempts to parse HTML files as JSON, and consequently crashes
(:ghpull:`4284`).

.. _release-5.7.3:

5.7.3
-----

5.7.3 contains one security improvement and one security fix:

- Launch the browser with a local file which redirects to the server address
  including the authentication token (:ghpull:`4260`).
  This prevents another logged-in user from stealing the token from command line
  arguments and authenticating to the server.
  The single-use token previously used to mitigate this has been removed.
  Thanks to Dr. Owain Kenway for suggesting the local file approach.
- Upgrade bootstrap to 3.4, fixing an XSS vulnerability, which has been
  assigned `CVE-2018-14041 <https://nvd.nist.gov/vuln/detail/CVE-2018-14041>`_
  (:ghpull:`4271`).

.. _release-5.7.2:

5.7.2
-----

5.7.2 contains a security fix preventing malicious directory names
from being able to execute javascript. CVE request pending.

.. _release-5.7.1:

5.7.1
-----

5.7.1 contains a security fix preventing nbconvert endpoints from executing javascript with access to the server API. CVE request pending.

.. _release-5.7.0:

5.7.0
-----

New features:

- Update to CodeMirror to 5.37, which includes f-string sytax for Python 3.6 (:ghpull:`3816`)
- Update jquery-ui to 1.12 (:ghpull:`3836`)
- Check Host header to more securely protect localhost deployments from DNS rebinding.
  This is a pre-emptive measure, not fixing a known vulnerability (:ghpull:`3766`).
  Use ``.NotebookApp.allow_remote_access`` and ``.NotebookApp.local_hostnames`` to configure
  access.
- Allow access-control-allow-headers to be overridden (:ghpull:`3886`)
- Allow configuring max_body_size and max_buffer_size (:ghpull:`3829`)
- Allow configuring get_secure_cookie keyword-args (:ghpull:`3778`)
- Respect nbconvert entrypoints as sources for exporters (:ghpull:`3879`)
- Include translation sources in source distributions (:ghpull:`3925`, :ghpull:`3931`)
- Various improvements to documentation (:ghpull:`3799`, :ghpull:`3800`,
  :ghpull:`3806`, :ghpull:`3883`, :ghpull:`3908`)

Fixing problems:

- Fix breadcrumb link when running with a base url (:ghpull:`3905`)
- Fix possible type error when closing activity stream (:ghpull:`3907`)
- Disable metadata editing for non-editable cells (:ghpull:`3744`)
- Fix some styling and alignment of prompts caused by regressions in 5.6.0.
- Enter causing page reload in shortcuts editor (:ghpull:`3871`)
- Fix uploading to the same file twice (:ghpull:`3712`)

See the 5.7 milestone on GitHub for a complete list of
`pull requests <https://github.com/jupyter/notebook/pulls?utf8=%E2%9C%93&q=is%3Apr%20milestone%3A5.7>`__ involved in this release.

Thanks to the following contributors:

* Aaron Hall
* Benjamin Ragan-Kelley
* Bill Major
* bxy007
* Dave Aitken
* Denis Ledoux
* Félix-Antoine Fortin
* Gabriel
* Grant Nestor
* Kevin Bates
* Kristian Gregorius Hustad
* M Pacer
* Madicken Munk
* Maitiu O Ciarain
* Matthias Bussonnier
* Michael Boyle
* Michael Chirico
* Mokkapati, Praneet(ES)
* Peter Parente
* Sally Wilsak
* Steven Silvester
* Thomas Kluyver
* Walter Martin

.. _release-5.6.0:

5.6.0
-----

New features:

- Execute cells by clicking icon in input prompt (:ghpull:`3535`, :ghpull:`3687`)
- New "Save as" menu option (:ghpull:`3289`)
- When serving on a loopback interface, protect against DNS rebinding by
  checking the ``Host`` header from the browser (:ghpull:`3714`).
  This check can be disabled if necessary by setting
  ``NotebookApp.allow_remote_access``.
  (Disabled by default while we work out some Mac issues in :ghissue:`3754`).
- Add kernel_info_timeout traitlet to enable restarting slow kernels (:ghpull:`3665`)
- Add ``custom_display_host`` config option to override displayed URL (:ghpull:`3668`)
- Add /metrics endpoint for Prometheus Metrics (:ghpull:`3490`)
- Update to MathJax 2.7.4 (:ghpull:`3751`)
- Update to jQuery 3.3 (:ghpull:`3655`)
- Update marked to 0.4 (:ghpull:`3686`)

Fixing problems:

- Don't duplicate token in displayed URL (:ghpull:`3656`)
- Clarify displayed URL when listening on all interfaces (:ghpull:`3703`)
- Don't trash non-empty directories on Windows (:ghpull:`3673`)
- Include LICENSE file in wheels (:ghpull:`3671`)
- Don't show "0 active kernels" when starting the notebook (:ghpull:`3696`)

Testing:

- Add find replace test (:ghpull:`3630`)
- Selenium test for deleting all cells (:ghpull:`3601`)
- Make creating a new notebook more robust (:ghpull:`3726`)

Thanks to the following contributors:

- Arovit Narula (`arovit <https://github.com/arovit>`__)
- lucasoshiro (`lucasoshiro <https://github.com/lucasoshiro>`__)
- M Pacer (`mpacer <https://github.com/mpacer>`__)
- Thomas Kluyver (`takluyver <https://github.com/takluyver>`__)
- Todd (`toddrme2178 <https://github.com/toddrme2178>`__)
- Yuvi Panda (`yuvipanda <https://github.com/yuvipanda>`__)

See the 5.6 milestone on GitHub for a complete list of
`pull requests <https://github.com/jupyter/notebook/pulls?utf8=%E2%9C%93&q=is%3Apr%20milestone%3A5.6>`__ involved in this release.

.. _release-5.5.0:

5.5.0
-----

New features:

- The files list now shows file sizes (:ghpull:`3539`)
- Add a quit button in the dashboard (:ghpull:`3004`)
- Display hostname in the terminal when running remotely (:ghpull:`3356`, :ghpull:`3593`)
- Add slides exportation/download to the menu (:ghpull:`3287`)
- Add any extra installed nbconvert exporters to the "Download as" menu (:ghpull:`3323`)
- Editor: warning when overwriting a file that is modified on disk (:ghpull:`2783`)
- Display a warning message if cookies are not enabled (:ghpull:`3511`)
- Basic ``__version__`` reporting for extensions (:ghpull:`3541`)
- Add ``NotebookApp.terminals_enabled`` config option (:ghpull:`3478`)
- Make buffer time between last modified on disk and last modified on last save configurable (:ghpull:`3273`)
- Allow binding custom shortcuts for 'close and halt' (:ghpull:`3314`)
- Add description for 'Trusted' notification (:ghpull:`3386`)
- Add ``settings['activity_sources']`` (:ghpull:`3401`)
- Add an ``output_updated.OutputArea`` event (:ghpull:`3560`)


Fixing problems:

- Fixes to improve web accessibility (:ghpull:`3507`)

  - There is more to do on this! See :ghissue:`1801`.

- Fixed color contrast issue in tree.less (:ghpull:`3336`)
- Allow cancelling upload of large files (:ghpull:`3373`)
- Don't clear login cookie on requests without cookie (:ghpull:`3380`)
- Don't trash files on different device to home dir on Linux (:ghpull:`3304`)
- Clear waiting asterisks when restarting kernel (:ghpull:`3494`)
- Fix output prompt when ``execution_count`` missing (:ghpull:`3236`)
- Make the 'changed on disk' dialog work when displayed twice (:ghpull:`3589`)
- Fix going back to root directory with history in notebook list (:ghpull:`3411`)
- Allow defining keyboard shortcuts for missing actions (:ghpull:`3561`)
- Prevent default on pageup/pagedown when completer is active (:ghpull:`3500`)
- Prevent default event handling on new terminal (:ghpull:`3497`)
- ConfigManager should not write out default values found in the .d directory (:ghpull:`3485`)
- Fix leak of iopub object in activity monitoring (:ghpull:`3424`)
- Javascript lint in notebooklist.js (:ghpull:`3409`)
- Some Javascript syntax fixes (:ghpull:`3294`)
- Convert native for loop to ``Array.forEach()`` (:ghpull:`3477`)
- Disable cache when downloading nbconvert output (:ghpull:`3484`)
- Add missing digestmod arg to HMAC (:ghpull:`3399`)
- Log OSErrors failing to create less-critical files during startup (:ghpull:`3384`)
- Use powershell on Windows (:ghpull:`3379`)
- API spec improvements, API handler improvements (:ghpull:`3368`)
- Set notebook to dirty state after change to kernel metadata (:ghpull:`3350`)
- Use CSP header to treat served files as belonging to a separate origin (:ghpull:`3341`)
- Don't install gettext into builtins (:ghpull:`3330`)
- Add missing ``import _`` (:ghpull:`3316`, :ghpull:`3326`)
- Write ``notebook.json`` file atomically (:ghpull:`3305`)
- Fix clicking with modifiers, page title updates (:ghpull:`3282`)
- Upgrade jQuery to version 2.2 (:ghpull:`3428`)
- Upgrade xterm.js to 3.1.0 (:ghpull:`3189`)
- Upgrade moment.js to 2.19.3 (:ghpull:`3562`)
- Upgrade CodeMirror to 5.35 (:ghpull:`3372`)
- "Require" pyzmq>=17 (:ghpull:`3586`)

Documentation:

- Documentation updates and organisation (:ghpull:`3584`)
- Add section in docs about privacy (:ghpull:`3571`)
- Add explanation on how to change the type of a cell to Markdown (:ghpull:`3377`)
- Update docs with confd implementation details (:ghpull:`3520`)
- Add more information for where ``jupyter_notebook_config.py`` is located (:ghpull:`3346`)
- Document options to enable nbextensions in specific sections (:ghpull:`3525`)
- jQuery attribute selector value MUST be surrounded by quotes (:ghpull:`3527`)
- Do not execute special notebooks with nbsphinx (:ghpull:`3360`)
- Other minor fixes in :ghpull:`3288`, :ghpull:`3528`, :ghpull:`3293`, :ghpull:`3367`

Testing:

- Testing with Selenium & Sauce labs (:ghpull:`3321`)
- Selenium utils + markdown rendering tests (:ghpull:`3458`)
- Convert insert cell tests to Selenium (:ghpull:`3508`)
- Convert prompt numbers tests to Selenium (:ghpull:`3554`)
- Convert delete cells tests to Selenium (:ghpull:`3465`)
- Convert undelete cell tests to Selenium (:ghpull:`3475`)
- More selenium testing utilities (:ghpull:`3412`)
- Only check links when build is trigger by Travis Cron job (:ghpull:`3493`)
- Fix Appveyor build errors (:ghpull:`3430`)
- Undo patches in teardown before attempting to delete files (:ghpull:`3459`)
- Get tests running with tornado 5 (:ghpull:`3398`)
- Unpin ipykernel version on Travis (:ghpull:`3223`)

Thanks to the following contributors:

- Arovit Narula (`arovit <https://github.com/arovit>`__)
- Ashley Teoh (`ashleytqy <https://github.com/ashleytqy>`__)
- Nicholas Bollweg (`bollwyvl <https://github.com/bollwyvl>`__)
- Alex Rothberg (`cancan101 <https://github.com/cancan101>`__)
- Celina Kilcrease (`ckilcrease <https://github.com/ckilcrease>`__)
- dabuside (`dabuside <https://github.com/dabuside>`__)
- Damian Avila (`damianavila <https://github.com/damianavila>`__)
- Dana Lee (`danagilliann <https://github.com/danagilliann>`__)
- Dave Hirschfeld (`dhirschfeld <https://github.com/dhirschfeld>`__)
- Heng GAO (`ehengao <https://github.com/ehengao>`__)
- Leo Gallucci (`elgalu <https://github.com/elgalu>`__)
- Evan Van Dam (`evandam <https://github.com/evandam>`__)
- forbxy (`forbxy <https://github.com/forbxy>`__)
- Grant Nestor (`gnestor <https://github.com/gnestor>`__)
- Ethan T. Hendrix (`hendrixet <https://github.com/hendrixet>`__)
- Miro Hrončok (`hroncok <https://github.com/hroncok>`__)
- Paul Ivanov (`ivanov <https://github.com/ivanov>`__)
- Darío Hereñú (`kant <https://github.com/kant>`__)
- Kevin Bates (`kevin-bates <https://github.com/kevin-bates>`__)
- Maarten Breddels (`maartenbreddels <https://github.com/maartenbreddels>`__)
- Michael Droettboom (`mdboom <https://github.com/mdboom>`__)
- Min RK (`minrk <https://github.com/minrk>`__)
- M Pacer (`mpacer <https://github.com/mpacer>`__)
- Peter Parente (`parente <https://github.com/parente>`__)
- Paul Masson (`paulmasson <https://github.com/paulmasson>`__)
- Philipp Rudiger (`philippjfr <https://github.com/philippjfr>`__)
- Mac Knight (`Shels1909 <https://github.com/Shels1909>`__)
- Hisham Elsheshtawy (`Sheshtawy <https://github.com/Sheshtawy>`__)
- Simon Biggs (`SimonBiggs <https://github.com/SimonBiggs>`__)
- Sunil Hari (`sunilhari <https://github.com/sunilhari>`__)
- Thomas Kluyver (`takluyver <https://github.com/takluyver>`__)
- Tim Klever (`tklever <https://github.com/tklever>`__)
- Gabriel Ruiz (`unnamedplay-r <https://github.com/unnamedplay-r>`__)
- Vaibhav Sagar (`vaibhavsagar <https://github.com/vaibhavsagar>`__)
- William Hosford (`whosford <https://github.com/whosford>`__)
- Hong (`xuhdev <https://github.com/xuhdev>`__)

See the 5.5 milestone on GitHub for a complete list of
`pull requests <https://github.com/jupyter/notebook/pulls?utf8=%E2%9C%93&q=is%3Apr%20milestone%3A5.5>`__ involved in this release.

.. _release-5.4.1:

5.4.1
-----

A security release to fix `CVE-2018-8768
<http://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2018-8768>`_.

Thanks to `Alex <https://hackerone.com/pisarenko>`__ for identifying this bug,
and Jonathan Kamens and Scott Sanderson at Quantopian for verifying it and
bringing it to our attention.

.. _release-5.4.0:

5.4.0
-----

- Fix creating files and folders after navigating directories in the dashboard
  (:ghpull:`3264`).
- Enable printing notebooks in colour, removing the CSS that made everything
  black and white (:ghpull:`3212`).
- Limit the completion options displayed in the notebook to 1000, to avoid
  performance issues with very long lists (:ghpull:`3195`).
- Accessibility improvements in ``tree.html`` (:ghpull:`3271`).
- Added alt-text to the kernel logo image in the notebook UI (:ghpull:`3228`).
- Added a test on Travis CI to flag if symlinks are accidentally introduced
  in the future. This should prevent the issue that necessitated
  :ref:`release-5.3.1` (:ghpull:`3227`).
- Use lowercase letters for random IDs generated in our Javascript
  (:ghpull:`3264`).
- Removed duplicate code setting ``TextCell.notebook`` (:ghpull:`3256`).

Thanks to the following contributors:

- Alex Soderman (`asoderman <https://github.com/asoderman>`__)
- Matthias Bussonnier (`Carreau <https://github.com/Carreau>`__)
- Min RK (`minrk <https://github.com/minrk>`__)
- Nitesh Sawant (`ns23 <https://github.com/ns23>`__)
- Thomas Kluyver (`takluyver <https://github.com/takluyver>`__)
- Yuvi Panda (`yuvipanda <https://github.com/yuvipanda>`__)

See the 5.4 milestone on GitHub for a complete list of
`pull requests <https://github.com/jupyter/notebook/pulls?utf8=%E2%9C%93&q=is%3Apr%20milestone%3A5.4>`__ involved in this release.

.. _release-5.3.1:

5.3.1
-----

Replaced a symlink in the repository with a copy, to fix issues installing
on Windows (:ghpull:`3220`).

.. _release-5.3.0:

5.3.0
-----

This release introduces a couple noteable improvements, such as terminal support for Windows and support for OS trash (files deleted from the notebook dashboard are moved to the OS trash vs. deleted permanently).

- Add support for terminals on windows (:ghpull:`3087`). 
- Add a "restart and run all" button to the toolbar (:ghpull:`2965`). 
- Send files to os trash mechanism on delete (:ghpull:`1968`). 
- Allow programmatic copy to clipboard (:ghpull:`3088`). 
- Use DOM History API for navigating between directories in the file browser (:ghpull:`3115`).
- Add translated files to folder(docs-translations) (:ghpull:`3065`). 
- Allow non empty dirs to be deleted (:ghpull:`3108`). 
- Set cookie on base_url (:ghpull:`2959`). 
- Allow token-authenticated requests cross-origin by default (:ghpull:`2920`). 
- Change cull_idle_timeout_minimum to 1 from 300 (:ghpull:`2910`). 
- Config option to shut down server after n seconds with no kernels (:ghpull:`2963`). 
- Display a "close" button on load notebook error (:ghpull:`3176`). 
- Add action to command pallette to run CodeMirror's "indentAuto" on selection (:ghpull:`3175`). 
- Add option to specify extra services (:ghpull:`3158`). 
- Warn_bad_name should not use global name (:ghpull:`3160`). 
- Avoid overflow of hidden form (:ghpull:`3148`). 
- Fix shutdown trans loss (:ghpull:`3147`). 
- Find available kernelspecs more efficiently (:ghpull:`3136`). 
- Don\'t try to translate missing help strings (:ghpull:`3122`). 
- Frontend/extension-config: allow default json files in a .d directory (:ghpull:`3116`). 
- Use `requirejs` vs. `require` (:ghpull:`3097`). 
- Fixes some ui bugs in firefox #3044 (:ghpull:`3058`). 
- Compare non-specific language code when choosing to use arabic numerals (:ghpull:`3055`). 
- Fix save-script deprecation (:ghpull:`3053`). 
- Include moment locales in package_data (:ghpull:`3051`). 
- Fix moment locale loading in bidi support (:ghpull:`3048`). 
- Tornado 5: periodiccallback loop arg will be removed (:ghpull:`3034`). 
- Use `/files` prefix for pdf-like files (:ghpull:`3031`). 
- Add folder for document translation (:ghpull:`3022`). 
- When login-in via token, let a chance for user to set the password (:ghpull:`3008`). 
- Switch to jupyter_core implementation of ensure_dir_exists (:ghpull:`3002`). 
- Send http shutdown request on \'stop\' subcommand (:ghpull:`3000`). 
- Work on loading ui translations  (:ghpull:`2969`). 
- Fix ansi inverse (:ghpull:`2967`). 
- Add send2trash to requirements for building docs (:ghpull:`2964`). 
- I18n readme.md improvement (:ghpull:`2962`).  
- Add \'reason\' field to json error responses (:ghpull:`2958`).
- Add some padding for stream outputs (:ghpull:`3194`).
- Always use setuptools in ``setup.py`` (:ghpull:`3206`).
- Fix clearing cookies on logout when ``base_url`` is configured (:ghpull:`3207`).

Thanks to the following contributors:

- bacboc (`bacboc <https://github.com/bacboc>`__)
- Steven Silvester (`blink1073 <https://github.com/blink1073>`__)
- Matthias Bussonnier (`Carreau <https://github.com/Carreau>`__)
- ChungJooHo (`ChungJooHo <https://github.com/ChungJooHo>`__)
- edida (`edida <https://github.com/edida>`__)
- Francesco Franchina (``ferdas``)
- forbxy (`forbxy <https://github.com/forbxy>`__)
- Grant Nestor (`gnestor <https://github.com/gnestor>`__)
- Josh Barnes (`jcb91 <https://github.com/jcb91>`__)
- JocelynDelalande (`JocelynDelalande <https://github.com/JocelynDelalande>`__)
- Karthik Balakrishnan (`karthikb351 <https://github.com/karthikb351>`__)
- Kevin Bates (`kevin-bates <https://github.com/kevin-bates>`__)
- Kirit Thadaka (`kirit93 <https://github.com/kirit93>`__)
- Lilian Besson (`Naereen <https://github.com/Naereen>`__)
- Maarten Breddels (`maartenbreddels <https://github.com/maartenbreddels>`__)
- Madhu94 (`Madhu94 <https://github.com/Madhu94>`__)
- Matthias Geier (`mgeier <https://github.com/mgeier>`__)
- Michael Heilman (`mheilman <https://github.com/mheilman>`__)
- Min RK (`minrk <https://github.com/minrk>`__)
- PHaeJin (`PHaeJin <https://github.com/PHaeJin>`__)
- Sukneet (`Sukneet <https://github.com/Sukneet>`__)
- Thomas Kluyver (`takluyver <https://github.com/takluyver>`__)

See the 5.3 milestone on GitHub for a complete list of
`pull requests <https://github.com/jupyter/notebook/pulls?utf8=%E2%9C%93&q=is%3Apr%20milestone%3A5.3>`__ involved in this release.

.. _release-5.2.1:

5.2.1
-----

- Fix invisible CodeMirror cursor at specific browser zoom levels (:ghpull:`2983`). 
- Fix nbconvert handler causing broken export to PDF (:ghpull:`2981`). 
- Fix the prompt_area argument of the output area constructor. (:ghpull:`2961`). 
- Handle a compound extension in new_untitled (:ghpull:`2949`). 
- Allow disabling offline message buffering (:ghpull:`2916`). 

Thanks to the following contributors:

- Steven Silvester (`blink1073 <https://github.com/blink1073>`__)
- Grant Nestor (`gnestor <https://github.com/gnestor>`__)
- Jason Grout (`jasongrout <https://github.com/jasongrout>`__)
- Min RK (`minrk <https://github.com/minrk>`__)
- M Pacer (`mpacer <https://github.com/mpacer>`__)

See the 5.2.1 milestone on GitHub for a complete list of
`pull requests <https://github.com/jupyter/notebook/pulls?utf8=%E2%9C%93&q=is%3Apr%20milestone%3A5.2.1>`__ involved in this release.

.. _release-5.2.0:

5.2.0
-----

- Allow setting token via jupyter_token env (:ghpull:`2921`). 
- Fix some errors caused by raising 403 in get_current_user (:ghpull:`2919`). 
- Register contents_manager.files_handler_class directly (:ghpull:`2917`). 
- Update viewable_extensions (:ghpull:`2913`). 
- Show edit shortcuts modal after shortcuts modal is hidden (:ghpull:`2912`). 
- Improve edit/view behavior (:ghpull:`2911`). 
- The root directory of the notebook server should never be hidden (:ghpull:`2907`). 
- Fix notebook require config to match tools/build-main (:ghpull:`2888`). 
- Give page constructor default arguments (:ghpull:`2887`). 
- Fix codemirror.less to match codemirror\'s expected padding layout (:ghpull:`2880`). 
- Add x-xsrftoken to access-control-allow-headers (:ghpull:`2876`). 
- Buffer messages when websocket connection is interrupted (:ghpull:`2871`). 
- Load locale dynamically only when not en-us (:ghpull:`2866`). 
- Changed key strength to 2048 bits (:ghpull:`2861`). 
- Resync jsversion with python version (:ghpull:`2860`). 
- Allow copy operation on modified, read-only notebook (:ghpull:`2854`). 
- Update error handling on apihandlers (:ghpull:`2853`). 
- Test python 3.6 on travis, drop 3.3 (:ghpull:`2852`). 
- Avoid base64-literals in image tests (:ghpull:`2851`). 
- Upgrade xterm.js to 2.9.2 (:ghpull:`2849`). 
- Changed all python variables named file to file_name to not override built_in file (:ghpull:`2830`). 
- Add more doc tests (:ghpull:`2823`). 
- Typos fix (:ghpull:`2815`). 
- Rename and update license [ci skip] (:ghpull:`2810`). 
- Travis builds doc  (:ghpull:`2808`). 
- Pull request i18n  (:ghpull:`2804`). 
- Factor out output_prompt_function, as is done with input prompt (:ghpull:`2774`). 
- Use rfc5987 encoding for filenames (:ghpull:`2767`). 
- Added path to the resources metadata, the same as in from_filename(...) in nbconvert.exporters.py (:ghpull:`2753`). 
- Make "extrakeys" consistent for notebook and editor (:ghpull:`2745`). 
- Bidi support (:ghpull:`2357`). 

Special thanks to `samarsultan <https://github.com/samarsultan>`__ and the Arabic Competence and Globalization Center Team at IBM Egypt for adding RTL (right-to-left) support to the notebook!

See the 5.2 milestone on GitHub for a complete list of
`issues <https://github.com/jupyter/notebook/issues?utf8=%E2%9C%93&q=is%3Aissue%20milestone%3A5.2>`__
and `pull requests <https://github.com/jupyter/notebook/pulls?utf8=%E2%9C%93&q=is%3Apr%20milestone%3A5.2>`__ involved in this release.

.. _release-5.1.0:

5.1.0
-----

- Preliminary i18n implementation (:ghpull:`2140`).
- Expose URL with auth token in notebook UI (:ghpull:`2666`).
- Fix search background style (:ghpull:`2387`).
- List running notebooks without requiring ``--allow-root`` (:ghpull:`2421`).
- Allow session of type other than notebook (:ghpull:`2559`).
- Fix search background style (:ghpull:`2387`).
- Fix some Markdown styling issues (:ghpull:`2571`), (:ghpull:`2691`) and (:ghpull:`2534`).
- Remove keymaps that conflict with non-English keyboards (:ghpull:`2535`).
- Add session-specific favicons (notebook, terminal, file) (:ghpull:`2452`).
- Add /api/shutdown handler (:ghpull:`2507`).
- Include metadata when copying a cell (:ghpull:`2349`).
- Stop notebook server from command line (:ghpull:`2388`).
- Improve "View" and "Edit" file handling in dashboard (:ghpull:`2449`) and (:ghpull:`2402`).
- Provide a promise to replace use of the ``app_initialized.NotebookApp`` event (:ghpull:`2710`).
- Fix disabled collapse/expand output button (:ghpull:`2681`).
- Cull idle kernels using ``--MappingKernelManager.cull_idle_timeout`` (:ghpull:`2215`).
- Allow read-only notebooks to be trusted (:ghpull:`2718`).

See the 5.1 milestone on GitHub for a complete list of
`issues <https://github.com/jupyter/notebook/issues?utf8=%E2%9C%93&q=is%3Aissue%20milestone%3A5.1>`__
and `pull requests <https://github.com/jupyter/notebook/pulls?utf8=%E2%9C%93&q=is%3Apr%20milestone%3A5.1>`__ involved in this release.

.. _release-5.0.0:

5.0.0
-----

This is the first major release of the Jupyter Notebook since version 4.0 was
created by the "Big Split" of IPython and Jupyter.

We encourage users to start trying JupyterLab in preparation for a future
transition.

We have merged more than 300 pull requests since 4.0. Some of the
major user-facing changes are described here.

File sorting in the dashboard
*****************************

Files in the dashboard may now be sorted by last modified date or name (:ghpull:`943`):

.. image:: /_static/images/dashboard-sort.png
   :align: center 

Cell tags
*********

There is a new cell toolbar for adding *cell tags* (:ghpull:`2048`):

.. image:: /_static/images/cell-tags-toolbar.png
   :align: center

Cell tags are a lightweight way to customise the behaviour of tools working with
notebooks; we're working on building support for them into tools like `nbconvert
<https://nbconvert.readthedocs.io/en/latest/>`__ and `nbval
<https://github.com/computationalmodelling/nbval>`__. To start using tags,
select ``Tags`` in the ``View > Cell Toolbar`` menu in a notebook.

The UI for editing cell tags is basic for now; we hope to improve it in future
releases.

Table style
***********

The default styling for tables in the notebook has been updated (:ghpull:`1776`).

Before:

.. image:: /_static/images/table-style-before.png
   :align: center
   
After:

.. image:: /_static/images/table-style-after.png
  :align: center

Customise keyboard shortcuts
****************************

You can now edit keyboard shortcuts for *Command Mode* within the UI
(:ghpull:`1347`):

.. image:: /_static/images/shortcut-editor.png
   :align: center

See the ``Help > Edit Keyboard Shortcuts`` menu item and follow the instructions.

Other additions
***************

- You can copy and paste cells between notebooks, using :kbd:`Ctrl-C` and
  :kbd:`Ctrl-V` (:kbd:`Cmd-C` and :kbd:`Cmd-V` on Mac).

- It's easier to configure a password for the notebook with the new
  ``jupyter notebook password`` command (:ghpull:`2007`).

- The file list can now be ordered by *last modified* or by *name*
  (:ghpull:`943`).

- Markdown cells now support attachments. Simply drag and drop an image from
  your desktop to a markdown cell to add it. Unlike relative links that you
  enter manually, attachments are embedded in the notebook itself. An
  unreferenced attachment will be automatically scrubbed from the notebook on
  save (:ghpull:`621`).

- Undoing cell deletion now supports undeleting multiple cells. Cells may not be
  in the same order as before their deletion, depending on the actions you did
  on the meantime, but this should should help reduce the impact of
  accidentally deleting code.

- The file browser now has *Edit* and *View* buttons.

- The file browser now supports moving multiple files at once
  (:ghpull:`1088`).

- The Notebook will refuse to run as root unless the ``--allow-root`` flag is
  given (:ghpull:`1115`).

- Keyboard shortcuts are now declarative (:ghpull:`1234`).

- Toggling line numbers can now affect all cells (:ghpull:`1312`).

- Add more visible *Trusted* and *Untrusted* notifications (:ghpull:`1658`).

- The favicon (browser shortcut icon) now changes to indicate when the kernel is busy
  (:ghpull:`1837`).
  
- Header and toolbar visibility is now persisted in nbconfig and across sessions
  (:ghpull:`1769`).

- Load server extensions with ConfigManager so that merge happens recursively,
  unlike normal config values, to make it load more consistently with frontend
  extensions(:ghpull:`2108`).

- The notebook server now supports the `bundler API
  <https://jupyter-notebook.readthedocs.io/en/latest/extending/bundler_extensions.html>`__
  from the `jupyter_cms incubator project
  <https://github.com/jupyter-incubator/contentmanagement>`__ (:ghpull:`1579`).

- The notebook server now provides information about kernel activity in
  its kernel resource API (:ghpull:`1827`).

Remember that upgrading ``notebook`` only affects the user
interface. Upgrading kernels and libraries may also provide new features,
better stability and integration with the notebook interface.

.. _release-4.4.0:

4.4.0
-----

- Allow override of output callbacks to redirect output messages. This is used to implement the ipywidgets Output widget, for example.
- Fix an async bug in message handling by allowing comm message handlers to return a promise which halts message processing until the promise resolves.

See the 4.4 milestone on GitHub for a complete list of
`issues <https://github.com/jupyter/notebook/issues?utf8=%E2%9C%93&q=is%3Aissue%20milestone%3A4.4>`__
and `pull requests <https://github.com/jupyter/notebook/pulls?utf8=%E2%9C%93&q=is%3Apr%20milestone%3A4.4>`__ involved in this release.

.. _release-4.3.2:

4.3.2
-----

4.3.2 is a patch release with a bug fix for CodeMirror and improved handling of the "editable" cell metadata field.

- Monkey-patch for CodeMirror that resolves `#2037 <https://github.com/jupyter/notebook/issues/2037>`__ without breaking `#1967 <https://github.com/jupyter/notebook/issues/1967>`__
- Read-only (``"editable": false``) cells can be executed but cannot be split, merged, or deleted

See the 4.3.2 milestone on GitHub for a complete list of
`issues <https://github.com/jupyter/notebook/issues?utf8=%E2%9C%93&q=is%3Aissue%20milestone%3A4.3.2>`__
and `pull requests <https://github.com/jupyter/notebook/pulls?utf8=%E2%9C%93&q=is%3Apr%20milestone%3A4.3.2>`__ involved in this release.

.. _release-4.3.1:

4.3.1
-----

4.3.1 is a patch release with a security patch, a couple bug fixes, and improvements to the newly-released token authentication.

**Security fix**:

- CVE-2016-9971. Fix CSRF vulnerability,
  where malicious forms could create untitled files and start kernels
  (no remote execution or modification of existing files)
  for users of certain browsers (Firefox, Internet Explorer / Edge).
  All previous notebook releases are affected.

Bug fixes:

- Fix carriage return handling
- Make the font size more robust against fickle browsers
- Ignore resize events that bubbled up and didn't come from window
- Add Authorization to allowed CORS headers
- Downgrade CodeMirror to 5.16 while we figure out issues in Safari

Other improvements:

- Better docs for token-based authentication
- Further highlight token info in log output when autogenerated

See the 4.3.1 milestone on GitHub for a complete list of
`issues <https://github.com/jupyter/notebook/issues?utf8=%E2%9C%93&q=is%3Aissue%20milestone%3A4.3.1>`__
and `pull requests <https://github.com/jupyter/notebook/pulls?utf8=%E2%9C%93&q=is%3Apr%20milestone%3A4.3.1>`__ involved in this release.

.. _release-4.3:

4.3.0
-----

4.3 is a minor release with many bug fixes and improvements.
The biggest user-facing change is the addition of token authentication,
which is enabled by default.
A token is generated and used when your browser is opened automatically,
so you shouldn't have to enter anything in the default circumstances.
If you see a login page
(e.g. by switching browsers, or launching on a new port with ``--no-browser``),
you get a login URL with the token from the command ``jupyter notebook list``,
which you can paste into your browser.


Highlights:

- API for creating mime-type based renderer extensions using :code:`OutputArea.register_mime_type` and :code:`Notebook.render_cell_output` methods. See `mimerender-cookiecutter <https://github.com/jupyterlab/mimerender-cookiecutter>`__ for reference implementations and cookiecutter.
- Enable token authentication by default. See :ref:`server_security` for more details.
- Update security docs to reflect new signature system
- Switched from term.js to xterm.js

Bug fixes:

- Ensure variable is set if exc_info is falsey
- Catch and log handler exceptions in :code:`events.trigger`
- Add debug log for static file paths
- Don't check origin on token-authenticated requests
- Remove leftover print statement
- Fix highlighting of Python code blocks
- :code:`json_errors` should be outermost decorator on API handlers
- Fix remove old nbserver info files
- Fix notebook mime type on download links
- Fix carriage symbol bahvior
- Fix terminal styles
- Update dead links in docs
- If kernel is broken, start a new session
- Include cross-origin check when allowing login URL redirects

Other improvements:

- Allow JSON output data with mime type ``application/*+json``
- Allow kernelspecs to have spaces in them for backward compat
- Allow websocket connections from scripts
- Allow :code:`None` for post_save_hook
- Upgrade CodeMirror to 5.21
- Upgrade xterm to 2.1.0
- Docs for using comms
- Set :code:`dirty` flag when output arrives
- Set :code:`ws-url` data attribute when accessing a notebook terminal
- Add base aliases for nbextensions
- Include :code:`@` operator in CodeMirror IPython mode
- Extend mathjax_url docstring
- Load nbextension in predictable order
- Improve the error messages for nbextensions
- Include cross-origin check when allowing login URL redirects

See the 4.3 milestone on GitHub for a complete list of
`issues <https://github.com/jupyter/notebook/issues?utf8=%E2%9C%93&q=is%3Aissue%20milestone%3A4.3%20>`__
and `pull requests <https://github.com/jupyter/notebook/pulls?utf8=%E2%9C%93&q=is%3Apr%20milestone%3A4.3%20>`__ involved in this release.


.. _release-4.2.3:

4.2.3
-----

4.2.3 is a small bugfix release on 4.2.

 Highlights:

- Fix regression in 4.2.2 that delayed loading custom.js
  until after ``notebook_loaded`` and ``app_initialized`` events have fired.
- Fix some outdated docs and links.

.. seealso::

    4.2.3 `on GitHub <https://github.com/jupyter/notebook/milestones/4.2.3>`__.

.. _release-4.2.2:

4.2.2
-----

4.2.2 is a small bugfix release on 4.2, with an important security fix.
All users are strongly encouraged to upgrade to 4.2.2.

 Highlights:

- **Security fix**: CVE-2016-6524, where untrusted latex output
  could be added to the page in a way that could execute javascript.
- Fix missing POST in OPTIONS responses.
- Fix for downloading non-ascii filenames.
- Avoid clobbering ssl_options, so that users can specify more detailed SSL
  configuration.
- Fix inverted load order in nbconfig, so user config has highest priority.
- Improved error messages here and there.

.. seealso::

    4.2.2 `on GitHub <https://github.com/jupyter/notebook/milestones/4.2.2>`__.

.. _release-4.2.1:

4.2.1
-----

4.2.1 is a small bugfix release on 4.2. Highlights:

- Compatibility fixes for some versions of ipywidgets
- Fix for ignored CSS on Windows
- Fix specifying destination when installing nbextensions

.. seealso::

    4.2.1 `on GitHub <https://github.com/jupyter/notebook/milestones/4.2.1>`__.

.. _release-4.2.0:

4.2.0
-----

Release 4.2 adds a new API for enabling and installing extensions.
Extensions can now be enabled at the system-level, rather than just per-user.
An API is defined for installing directly from a Python package, as well.

.. seealso::

    :doc:`./examples/Notebook/Distributing Jupyter Extensions as Python Packages`


Highlighted changes:

- Upgrade MathJax to 2.6 to fix vertical-bar appearing on some equations.
- Restore ability for notebook directory to be root (4.1 regression)
- Large outputs are now throttled, reducing the ability of output floods to
  kill the browser.
- Fix the notebook ignoring cell executions while a kernel is starting by
  queueing the messages.
- Fix handling of url prefixes (e.g. JupyterHub) in terminal and edit pages.
- Support nested SVGs in output.

And various other fixes and improvements.

.. _release-4.1.0:

4.1.0
-----

Bug fixes:

- Properly reap zombie subprocesses
- Fix cross-origin problems
- Fix double-escaping of the base URL prefix
- Handle invalid unicode filenames more gracefully
- Fix ANSI color-processing
- Send keepalive messages for web terminals
- Fix bugs in the notebook tour

UI changes:

- Moved the cell toolbar selector into the *View* menu. Added a button that
  triggers a "hint" animation to the main toolbar so users can find the new
  location. (Click here to see a `screencast <https://cloud.githubusercontent.com/assets/335567/10711889/59665a5a-7a3e-11e5-970f-86b89592880c.gif>`__ )

    .. image:: /_static/images/cell-toolbar-41.png

- Added *Restart & Run All* to the *Kernel* menu. Users can also bind it to a
  keyboard shortcut on action ``restart-kernel-and-run-all-cells``.
- Added multiple-cell selection. Users press ``Shift-Up/Down`` or ``Shift-K/J``
  to extend selection in command mode. Various actions such as cut/copy/paste,
  execute, and cell type conversions apply to all selected cells.

  .. image:: /_static/images/multi-select-41.png

- Added a command palette for executing Jupyter actions by name. Users press
  ``Cmd/Ctrl-Shift-P`` or click the new command palette icon on the toolbar.

  .. image:: /_static/images/command-palette-41.png

- Added a *Find and Replace* dialog to the *Edit* menu. Users can also press
  ``F`` in command mode to show the dialog.

  .. image:: /_static/images/find-replace-41.png

Other improvements:

- Custom KernelManager methods can be Tornado coroutines, allowing async
  operations.
- Make clearing output optional when rewriting input with
  ``set_next_input(replace=True)``.
- Added support for TLS client authentication via ``--NotebookApp.client-ca``.
- Added tags to ``jupyter/notebook`` releases on DockerHub. ``latest``
  continues to track the master branch.

See the 4.1 milestone on GitHub for a complete list of
`issues <https://github.com/jupyter/notebook/issues?page=3&q=milestone%3A4.1+is%3Aclosed+is%3Aissue&utf8=%E2%9C%93>`__
and `pull requests <https://github.com/jupyter/notebook/pulls?q=milestone%3A4.1+is%3Aclosed+is%3Apr>`__ handled.

4.0.x
-----

4.0.6
*****

- fix installation of mathjax support files
- fix some double-escape regressions in 4.0.5
- fix a couple of cases where errors could prevent opening a notebook

4.0.5
*****

Security fixes for maliciously crafted files.

- `CVE-2015-6938 <http://www.openwall.com/lists/oss-security/2015/09/02/3>`__: malicious filenames
- `CVE-2015-7337 <http://www.openwall.com/lists/oss-security/2015/09/16/3>`__: malicious binary files in text editor.

Thanks to Jonathan Kamens at Quantopian and Juan Broullón for the reports.


4.0.4
*****

- Fix inclusion of mathjax-safe extension

4.0.2
*****

- Fix launching the notebook on Windows
- Fix the path searched for frontend config


4.0.0
*****

First release of the notebook as a standalone package.
