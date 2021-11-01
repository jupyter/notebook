# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

from pathlib import Path

import setuptools

HERE = Path(__file__).parent.resolve()

# The name of the project
NAME = "retrolab"

labext_name = "@retrolab/lab-extension"
lab_extension_dest = HERE / NAME / "labextension"
main_bundle_dest = HERE / NAME / "static"

# Representative files that should exist after a successful build
ensured_targets = [
    str(lab_extension_dest / "static" / "style.js"),
    str(main_bundle_dest / "bundle.js"),
    str(HERE / NAME / "schemas/@retrolab/application-extension/package.json.orig"),
]

data_files_spec = [
    ("share/jupyter/labextensions/%s" % labext_name, str(lab_extension_dest), "**"),
    ("share/jupyter/labextensions/%s" % labext_name, str(HERE), "install.json"),
    ("share/jupyter/lab/schemas", f"{NAME}/schemas", "@retrolab/**/*"),
    (
        "etc/jupyter/jupyter_server_config.d",
        "jupyter-config/jupyter_server_config.d",
        "retrolab.json",
    ),
    (
        "etc/jupyter/jupyter_notebook_config.d",
        "jupyter-config/jupyter_notebook_config.d",
        "retrolab.json",
    ),
]

try:
    from jupyter_packaging import wrap_installers, npm_builder, get_data_files

    # In develop mode, just run yarn
    builder = npm_builder(build_cmd="build", npm="jlpm", force=True)
    cmdclass = wrap_installers(post_develop=builder, ensured_targets=ensured_targets)

    setup_args = dict(cmdclass=cmdclass, data_files=get_data_files(data_files_spec))
except ImportError:
    setup_args = dict()


if __name__ == "__main__":
    setuptools.setup(**setup_args)
