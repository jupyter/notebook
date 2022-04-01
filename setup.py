# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import subprocess
import sys
from pathlib import Path

import setuptools

HERE = Path(__file__).parent.resolve()

# The name of the project
NAME = "notebook"

labext_name = "@jupyter-notebook/lab-extension"
lab_extension_dest = HERE / NAME / "labextension"
main_bundle_dest = HERE / NAME / "static"

# Representative files that should exist after a successful build
ensured_targets = [
    str(lab_extension_dest / "static" / "style.js"),
    str(main_bundle_dest / "bundle.js"),
    str(HERE / NAME / "schemas/@jupyter-notebook/application-extension/package.json.orig"),
]

data_files_spec = [
    ("share/jupyter/labextensions/%s" % labext_name, str(lab_extension_dest), "**"),
    ("share/jupyter/labextensions/%s" % labext_name, str(HERE), "install.json"),
    ("share/jupyter/lab/schemas", f"{NAME}/schemas", "@jupyter-notebook/**/*"),
    (
        "etc/jupyter/jupyter_server_config.d",
        "jupyter-config/jupyter_server_config.d",
        "notebook.json",
    ),
    (
        "etc/jupyter/jupyter_notebook_config.d",
        "jupyter-config/jupyter_notebook_config.d",
        "notebook.json",
    ),
]

try:
    from jupyter_packaging import get_data_files, npm_builder, wrap_installers

    # In develop mode, just run yarn
    builder = npm_builder(build_cmd="build", npm="jlpm", force=True)

    def post_develop(*args, **kwargs):
        builder(*args, **kwargs)
        try:
            subprocess.run([sys.executable, "-m", "pre_commit", "install"])
            subprocess.run(
                [sys.executable, "-m", "pre_commit", "install", "--hook-type", "pre-push"]
            )
        except Exception:
            pass

    cmdclass = wrap_installers(post_develop=post_develop, ensured_targets=ensured_targets)

    setup_args = dict(cmdclass=cmdclass, data_files=get_data_files(data_files_spec))
except ImportError:
    setup_args = {}


if __name__ == "__main__":
    setuptools.setup(**setup_args)
