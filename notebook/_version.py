"""
store the current version info of the notebook.

"""

# Downstream maintainer, when running `python.setup.py jsversion`,
# the version string is propagated to the JavaScript files,  do not forget to
# patch the JavaScript files in `.postN` release done by distributions. 

# Next beta/alpha/rc release: The version number for beta is X.Y.ZbN **without dots**. 

version_info = (4, 1, 0, 'b1')
__version__ = '.'.join(map(str, version_info[:3])) + ''.join(version_info[3:])

import re

pep440re = re.compile('^(\d+)\.(\d+)\.(\d+((a|b|rc)\d+)?)(\.post\d+)?(\.dev\d+)?$')

def raise_on_bad_version(version):
    if not pep440re.match(version):
        raise ValueError("Versions String does apparently not match Pep 440 specification, "
                         "which might lead to sdist and wheel being seen as 2 different release. "
                         "E.g: do not use dots for beta/alpha/rc markers.")
        
