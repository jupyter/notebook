# Implementation Notes for Internationalization of Jupyter Notebook

This is a prototype implementation of i18n features for Jupyter notebook, and should not
yet be considered ready for production use.  I have tried to focus on the public user
interfaces in the notebook for the first cut, while leaving much of the console messages
behind, as their usefulness in a translated environment is questionable at best.

### Using a prototype translated version

In order to use this preliminary version, you need to do things after installing the
notebook as normal:

1. Set the LANG environment variable in your shell to "xx_XX" or just "xx".  
where "xx" is the language code you're wanting to run in. If you're
running on Windows, I've found the easiest way to do this is to use Windows PowerShell,
and run the command:

`${Env:LANG} = "xx_XX"` 

2. Set the preferred language for web pages in your browser to YourLanguage (xx). At the moment,
it has to be first in the list.

3. Run the `jupyter notebook` command to start the notebook.

### Message extraction:

I have split out the translatable material for the notebook into 3 POT, as follows:

notebook/i18n/notebook.pot - Console and startup messages, basically anything that is
	produced by Python code.
	
notebook/i18n/nbui.pot - User interface strings, as extracted from the Jinja2 templates
	in notebook/templates/*.html
	
noteook/i18n/nbjs.pot - JavaScript strings and dialogs, which contain much of the visible
	user interface for Jupyter notebook.
	
To extract the messages from the source code whenever new material is added, use the
`pybabel` command to extract messages from the source code as follows:
( assuming you are in the base directory for Jupyter notebook )

`pybabel extract -F notebook/i18n/babel_notebook.cfg -o notebook/i18n/notebook.pot --no-wrap --project Jupyter .`
`pybabel extract -F notebook/i18n/babel_nbui.cfg -o notebook/i18n/nbui.pot --no-wrap --project Jupyter .`
`pybabel extract -F notebook/i18n/babel_nbjs.cfg -o notebook/i18n/nbjs.pot --no-wrap --project Jupyter .`

(Note: there is a '.' at the end of these commands, and it has to be there...)

After this is complete you have 3 POT files that you can give to a translator for your favorite language.
Babel's documentation has instructions on how to integrate this into your setup.py so that eventually
we can just do:

`setup.py extract_messages`

I hope to get this working at some point in the near future.

### Post translation procedures

After the source material has been translated, you should have 3 PO files with the same base names
as the POT files above.  Put them in `notebook/i18n/${LANG}/LC_MESSAGES`, where ${LANG} is the language
code for your desired language ( i.e. German = "de", Japanese = "ja", etc. ).  The first 2 files then
need to be converted from PO to MO format for use at runtime. There are many different ways to do
this, but pybabel has an option to do this as follows:

`pybabel compile -D notebook -f -l ${LANG} -i notebook/i18n/${LANG}/LC_MESSAGES/notebook.po -o notebook/i18n/${LANG}/notebook.mo`

`pybabel compile -D nbui -f -l ${LANG} -i notebook/i18n/${LANG}/LC_MESSAGES/nbui.po -o notebook/i18n/${LANG}/nbui.mo`

The nbjs.po needs to be converted to JSON for use within the JavaScript code.  I'm using po2json for this, as follows:

`po2json -p -F -f jed1.x -d nbjs notebook/i18n/${LANG}/LC_MESSAGES/nbjs.po notebook/i18n/${LANG}/LC_MESSAGES/nbjs.json`

The conversions from PO to MO probably can and should be done during setup.py.

When new languages get added, their language codes should be added to notebook/i18n/nbjs.json
under the "supported_languages" element.

### Tips for Jupyter developers

The biggest "mistake" I found while doing i18n enablement was the habit of constructing UI messages
from English "piece parts".  For example, code like:


`var msg = "Enter a new " + type + "name:"`

where "type" is either "file", "directory", or "notebook"....

is problematic when doing translations, because the surrounding text may need to vary
depending on the inserted word. In this case, you need to switch it and use complete phrases,
as follows:

```javascript
var rename_msg = function (type) {
    switch(type) {
        case 'file': return _("Enter a new file name:");
        case 'directory': return _("Enter a new directory name:");
        case 'notebook': return _("Enter a new notebook name:");
        default: return _("Enter a new name:");
    }
}
```

Also you need to remember that adding an "s" or "es" to an English word to
create the plural form doesn't translate well.  Some languages have as many as 5 or 6 different
plural forms for differing numbers, so using an API such as ngettext() is necessary in order
to handle these cases properly.

### Known issues

1. Right now there are two different places where the desired language is set.  At startup time, the Jupyter console's messages pay attention to the setting of the ${LANG} environment variable
as set in the shell at startup time.  Unfortunately, this is also the time where the Jinja2
environment is set up, which means that the template stuff will always come from this setting.
We really want to be paying attention to the browser's settings for the stuff that happens in the
browser, so we need to be able to retrieve this information after the browser is started and somehow
communicate this back to Jinja2.  So far, I haven't yet figured out how to do this, which means that if the ${LANG} at startup doesn't match the browser's settings, you could potentially get a mix
of languages in the UI ( never a good thing ).

2. We will need to decide if console messages should be translatable, and enable them if desired.
3. The keyboard shorcut editor was implemented after the i18n work was completed, so that portion
does not have translation support at this time.

Any questions or comments please let me know @JCEmmons on github (emmo@us.ibm.com)

