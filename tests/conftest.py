import glob
import json
import os
import os.path as osp
import pathlib
import shutil
import sys

if sys.version_info < (3, 10):
    from importlib_resources import files
else:
    from importlib.resources import files

import pytest

from notebook.app import JupyterNotebookApp

pytest_plugins = ["jupyter_server.pytest_plugin"]


def mkdir(tmp_path, *parts):
    path = tmp_path.joinpath(*parts)
    if not path.exists():
        path.mkdir(parents=True)
    return path


app_settings_dir = pytest.fixture(lambda tmp_path: mkdir(tmp_path, "app_settings"))
user_settings_dir = pytest.fixture(lambda tmp_path: mkdir(tmp_path, "user_settings"))
schemas_dir = pytest.fixture(lambda tmp_path: mkdir(tmp_path, "schemas"))
workspaces_dir = pytest.fixture(lambda tmp_path: mkdir(tmp_path, "workspaces"))
labextensions_dir = pytest.fixture(lambda tmp_path: mkdir(tmp_path, "labextensions_dir"))


@pytest.fixture()
def make_notebook_app(  # PLR0913
    jp_root_dir,
    jp_template_dir,
    app_settings_dir,
    user_settings_dir,
    schemas_dir,
    workspaces_dir,
    labextensions_dir,
):
    def _make_notebook_app(**kwargs):
        return JupyterNotebookApp(
            static_dir=str(jp_root_dir),
            templates_dir=str(jp_template_dir),
            app_url="/",
            app_settings_dir=str(app_settings_dir),
            user_settings_dir=str(user_settings_dir),
            schemas_dir=str(schemas_dir),
            workspaces_dir=str(workspaces_dir),
            extra_labextensions_path=[str(labextensions_dir)],
        )

    # Copy the template files.
    for html_path in glob.glob(str(files("notebook.templates").joinpath("*.html"))):
        shutil.copy(html_path, jp_template_dir)

    # Create the index file.
    index = jp_template_dir.joinpath("index.html")
    index.write_text(
        """
<!DOCTYPE html>
<html>
<head>
  <title>{{page_config['appName'] | e}}</title>
</head>
<body>
    {# Copy so we do not modify the page_config with updates. #}
    {% set page_config_full = page_config.copy() %}
    {# Set a dummy variable - we just want the side effect of the update. #}
    {% set _ = page_config_full.update(baseUrl=base_url, wsUrl=ws_url) %}
      <script id="jupyter-config-data" type="application/json">
        {{ page_config_full | tojson }}
      </script>
  <script src="{{page_config['fullStaticUrl'] | e}}/bundle.js" main="index"></script>
  <script type="text/javascript">
    /* Remove token from URL. */
    (function () {
      var parsedUrl = new URL(window.location.href);
      if (parsedUrl.searchParams.get('token')) {
        parsedUrl.searchParams.delete('token');
        window.history.replaceState({ }, '', parsedUrl.href);
      }
    })();
  </script>
</body>
</html>
"""
    )

    # Copy the schema files.
    test_data = str(files("jupyterlab_server.test_data")._paths[0])
    src = pathlib.PurePath(test_data, "schemas", "@jupyterlab")
    dst = pathlib.PurePath(str(schemas_dir), "@jupyterlab")
    if os.path.exists(dst):
        shutil.rmtree(dst)
    shutil.copytree(src, dst)

    # Create the federated extensions
    for name in ["apputils-extension", "codemirror-extension"]:
        target_name = name + "-federated"
        target = pathlib.PurePath(str(labextensions_dir), "@jupyterlab", target_name)
        src = pathlib.PurePath(test_data, "schemas", "@jupyterlab", name)
        dst = target / "schemas" / "@jupyterlab" / target_name
        if osp.exists(dst):
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
        with open(target / "package.orig.json", "w") as fid:
            data = dict(name=target_name, jupyterlab=dict(extension=True))
            json.dump(data, fid)

    # Copy the overrides file.
    src = pathlib.PurePath(test_data, "app-settings", "overrides.json")
    dst = pathlib.PurePath(str(app_settings_dir), "overrides.json")
    if os.path.exists(dst):
        os.remove(dst)
    shutil.copyfile(src, dst)

    # Copy workspaces.
    ws_path = pathlib.PurePath(test_data, "workspaces")
    for item in os.listdir(ws_path):
        src = ws_path / item
        dst = pathlib.PurePath(str(workspaces_dir), item)
        if os.path.exists(dst):
            os.remove(dst)
        shutil.copy(src, str(workspaces_dir))

    return _make_notebook_app


@pytest.fixture()
def notebookapp(jp_serverapp, make_notebook_app):
    app = make_notebook_app()
    app._link_jupyter_server_extension(jp_serverapp)
    app.initialize()
    return app
