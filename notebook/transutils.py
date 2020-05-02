"""Translation related utilities. When imported, injects _ to builtins"""

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from .i18n import get_translation

# global default translation object (used for log messages)

trans = get_translation('notebook')
_ = trans.gettext
