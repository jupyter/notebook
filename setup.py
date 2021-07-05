"""
retrolab setup
"""
import os

from jupyter_packaging import (
    get_version,
    create_cmdclass,
    combine_commands,
    install_npm,
    ensure_targets,
    skip_if_exists,
)
import setuptools

HERE = os.path.abspath(os.path.dirname(__file__))

# The name of the project
NAME = "retrolab"
PACKAGE_NAME = NAME.replace("-", "_")

# Get our version
version = get_version(os.path.join(PACKAGE_NAME, "_version.py"))

main_bundle_dest = os.path.join(HERE, PACKAGE_NAME, "static")
main_bundle_source = os.path.join(HERE, "app")

labext_name = "@retrolab/lab-extension"
lab_extension_dest = os.path.join(HERE, PACKAGE_NAME, "labextension")
lab_extension_source = os.path.join(HERE, "packages", "lab-extension")

# Representative files that should exist after a successful build
jstargets = [
    os.path.join(lab_extension_dest, "package.json"),
    os.path.join(main_bundle_dest, "bundle.js"),
]

package_data_spec = {PACKAGE_NAME: ["*", "templates/*", "static/**"]}

data_files_spec = [
    ("share/jupyter/labextensions/%s" % labext_name, lab_extension_dest, "**"),
    ("share/jupyter/labextensions/%s" % labext_name, HERE, "install.json"),
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

cmdclass = create_cmdclass(
    "jsdeps", package_data_spec=package_data_spec, data_files_spec=data_files_spec
)

js_command = combine_commands(
    install_npm(HERE, build_cmd="install", npm=["jlpm"]),
    install_npm(HERE, build_cmd="build", npm=["jlpm"]),
    install_npm(main_bundle_source, build_cmd="build:prod", npm=["jlpm"]),
    ensure_targets(jstargets),
)

is_repo = os.path.exists(os.path.join(HERE, ".git"))
if is_repo:
    cmdclass["jsdeps"] = js_command
else:
    cmdclass["jsdeps"] = skip_if_exists(jstargets, js_command)


with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup_args = dict(
    name=NAME,
    version=version,
    url="https://github.com/jupyterlab/retrolab",
    author="Project Jupyter",
    description="JupyterLab Distribution with a retro look and feel",
    long_description=long_description,
    long_description_content_type="text/markdown",
    cmdclass=cmdclass,
    packages=setuptools.find_packages(),
    install_requires=[
        "jupyterlab>=3.1.0b0,<4",
        "jupyterlab_server~=2.3",
        "jupyter_server~=1.4",
        "nbclassic~=0.2",
        "tornado>=6.1.0",
    ],
    zip_safe=False,
    include_package_data=True,
    python_requires=">=3.6",
    license="BSD-3-Clause",
    platforms="Linux, Mac OS X, Windows",
    keywords=["Jupyter", "JupyterLab", "Notebook"],
    classifiers=[
        "License :: OSI Approved :: BSD License",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Framework :: Jupyter",
    ],
    entry_points={"console_scripts": ["jupyter-retro = retrolab.app:main"]},
)


if __name__ == "__main__":
    setuptools.setup(**setup_args)
