"""Server functions for loading translations
"""
from collections import defaultdict
import errno
import gettext
import glob
import io
import json
from os.path import basename, dirname, join as pjoin
import re


I18N_DIR = dirname(__file__)
# Cache structure:
# {'nbjs': {   # Domain
#   'zh-CN': {  # Language code
#     <english string>: <translated string>
#     ...
#   }
# }}
TRANSLATIONS_CACHE = {}
# COMBINED_CACHE is a cache of the json-serialized combined result
# for a given language combination
COMBINED_CACHE = {}

# the supported languages, as found in I18N_DIR
_SUPPORTED_LANGUAGES = set()

def _load_supported_languages():
    """Load the supported language list (just once)"""
    _SUPPORTED_LANGUAGES.clear()

    _SUPPORTED_LANGUAGES.add('en')

    for lang in glob.glob(pjoin(I18N_DIR, '??_??')):
        lang = basename(lang)
        # add both fr and fr_FR
        _SUPPORTED_LANGUAGES.add(lang.split('_')[0])
        _SUPPORTED_LANGUAGES.add(lang)
    return _SUPPORTED_LANGUAGES


def filter_languages(languages):
    """Filter a language list to only those that are supported"""
    if not _SUPPORTED_LANGUAGES:
        _load_supported_languages()
    filtered = []
    for language in languages:
        if language in _SUPPORTED_LANGUAGES and language not in filtered:
            filtered.append(language)
    return tuple(filtered)


_accept_lang_re = re.compile(r'''
(?P<lang>[a-zA-Z]{1,8}(-[a-zA-Z]{1,8})?)
(\s*;\s*q\s*=\s*
  (?P<qvalue>[01](.\d+)?)
)?''', re.VERBOSE)


def parse_accept_lang_header(accept_lang):
    """Parses the 'Accept-Language' HTTP header.

    Returns a list of language codes in *descending* order of preference
    (with the most preferred language first).
    """
    by_q = defaultdict(list)
    for part in accept_lang.split(','):
        m = _accept_lang_re.match(part.strip())
        if not m:
            continue
        lang, qvalue = m.group('lang', 'qvalue')
        # Browser header format is zh-CN, gettext uses zh_CN
        lang = lang.replace('-', '_')
        if qvalue is None:
            qvalue = 1.
        else:
            qvalue = float(qvalue)
        if qvalue == 0:
            continue  # 0 means not accepted
        by_q[qvalue].append(lang)

    res = []
    for qvalue, langs in sorted(by_q.items()):
        res.extend(sorted(langs))
    # make it a tuple so it's hashable
    return tuple(res[::-1])


def load(language, domain='nbjs'):
    """Load translations from an nbjs.json file"""
    try:
        f = io.open(pjoin(I18N_DIR, language, 'LC_MESSAGES', 'nbjs.json'),
                    encoding='utf-8')
    except IOError as e:
        if e.errno != errno.ENOENT:
            raise
        return {}

    with f:
        data = json.load(f)
    return data["locale_data"][domain]


def cached_load(language, domain='nbjs'):
    """Load translations for one language, using in-memory cache if available"""
    domain_cache = TRANSLATIONS_CACHE.setdefault(domain, {})
    try:
        return domain_cache[language]
    except KeyError:
        data = load(language, domain)
        domain_cache[language] = data
        return data


def combine_translations(lang_codes, domain='nbjs'):
    """Combine translations for multiple accepted languages.

    Returns data re-packaged in jed1.x format, serialized as JSON
    """
    lang_codes = filter_languages(lang_codes)
    if lang_codes in COMBINED_CACHE:
        return COMBINED_CACHE[lang_codes]

    combined = {}
    # step backwards because the first priority comes first
    # and we want to load that last
    for language in lang_codes[::-1]:
        if language == 'en':
            # en is default, all translations are in frontend.
            combined.clear()
        else:
            combined.update(cached_load(language, domain))

    combined[''] = {"domain": "nbjs"}

    COMBINED_CACHE[lang_codes] = json.dumps(
        {
            "domain": domain,
            "locale_data": {
                domain: combined
            }
        }
    )
    return COMBINED_CACHE[lang_codes]

# global translation cache
_GETTEXT_TRANSLATION_CACHE = {}


def get_translation(domain, languages=None):
    """get a gettext.translation object for a given domain

    Translation objects are cached, so each call with a given language list
    returns the same translation instance.

    The cache key is
    """
    domain_translations = _GETTEXT_TRANSLATION_CACHE.setdefault(domain, {})
    if languages:
        # filter languages to avoid duplicate entries in cache
        # with the same supported language subset,
        # e.g. [fr_FR, de_DE] and [fr_FR, es_ES] should both
        # return [fr_FR] when we have no translations for the other languages
        language_key = filter_languages(languages)
    else:
        language_key = None
    if language_key not in domain_translations:
        domain_translations[language_key] = gettext.translation(
            domain, languages=languages, localedir=I18N_DIR, fallback=True)
    return domain_translations[language_key]
