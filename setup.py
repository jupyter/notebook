"""
jupyterlab-classic setup
"""
import os

from jupyter_packaging import (
    get_version,
    create_cmdclass,
    combine_commands,
    install_npm,
    ensure_targets,
)
import setuptools

HERE = os.path.abspath(os.path.dirname(__file__))

# The name of the project
NAME = "jupyterlab-classic"
PACKAGE_NAME = NAME.replace("-", "_")

# Get our version
version = get_version(os.path.join(PACKAGE_NAME, "_version.py"))

labext_name = "@jupyterlab-classic/lab-extension"
lab_extension_dest = os.path.join(HERE, PACKAGE_NAME, "labextension")
lab_extension_source = os.path.join(HERE, "packages", "lab-extension")

# Representative files that should exist after a successful build
jstargets = [
    os.path.join(lab_extension_source, "lib", "index.js"),
    os.path.join(lab_extension_dest, "package.json"),
]

package_data_spec = {PACKAGE_NAME: ["*"]}

data_files_spec = [
    ("share/jupyter/labextensions/%s" % labext_name, lab_extension_dest, "**"),
    ("share/jupyter/labextensions/%s" % labext_name, HERE, "install.json"),
    (
        "etc/jupyter/jupyter_server_config.d",
        "jupyter-config/jupyter_server_config.d",
        "jupyterlab_classic.json",
    ),
    (
        "etc/jupyter/jupyter_notebook_config.d",
        "jupyter-config/jupyter_notebook_config.d",
        "jupyterlab_classic.json",
    ),
]

cmdclass = create_cmdclass(
    "jsdeps", package_data_spec=package_data_spec, data_files_spec=data_files_spec
)

cmdclass["jsdeps"] = combine_commands(
    install_npm(lab_extension_source, build_cmd="build", npm=["jlpm"]),
    ensure_targets(jstargets),
)

with open("README.md", "r") as fh:
    long_description = fh.read()

setup_args = dict(
    name=NAME,
    version=version,
    url="https://github.com/jtpio/jupyterlab-classic",
    author="Jeremy Tuloup",
    description="The next gen old-school Notebook UI",
    long_description=long_description,
    long_description_content_type="text/markdown",
    cmdclass= cmdclass,
    packages=setuptools.find_packages(),
    install_requires=[
        "jupyterlab>=3.0.0rc10,==3.*",
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
    entry_points={
        "console_scripts": ["jupyterlab-classic = jupyterlab_classic.app:main"]
    },
)


if __name__ == "__main__":
    setuptools.setup(**setup_args)
