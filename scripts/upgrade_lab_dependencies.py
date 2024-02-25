import json
import argparse
import requests

PACKAGE_JSON_PATHS = [
    "app/package.json",
    "buildutils/package.json",
    "package.json",
    "packages/application-extension/package.json",
    "packages/application/package.json",
    "packages/console-extension/package.json",
    "packages/docmanager-extension/package.json",
    "packages/documentsearch-extension/package.json",
    "packages/help-extension/package.json",
    "packages/lab-extension/package.json",
    "packages/notebook-extension/package.json",
    "packages/terminal-extension/package.json",
    "packages/tree-extension/package.json",
    "packages/tree/package.json",
    "packages/ui-components/package.json",
]

DEPENDENCY_NAME = "@jupyterlab"

def update_package_json(new_version):
    url = 'https://raw.githubusercontent.com/jupyterlab/jupyterlab/v{new_version}/jupyterlab/staging/package.json'
    
    response = requests.get(url)
    
    if response.status_code != 200:
        print(f"Failed to fetch package.json from {url}. HTTP status code: {response.status_code}")
        return
    
    new_package_json = response.json()

    for path in PACKAGE_JSON_PATHS:
        with open(path, 'r') as package_json_file:
            existing_package_json = json.load(package_json_file)
        
        new_dependencies = {**new_package_json.get('devDependencies', {}), **new_package_json.get('resolutions', {})}
        update_dependencies(existing_package_json, new_dependencies)

        with open(path, 'w') as file:
            json.dump(existing_package_json, file, indent=2)


def update_dependencies(existing, new):
    if(existing == None):
        return
    
    section_paths = ['resolutions','dependencies', 'devDependencies']

    for section in section_paths:
        if(existing.get(section) == None):
            continue

        updated = existing.get(section)
        for package, version in existing.get(section).items():
            if(package.startswith(DEPENDENCY_NAME) and package in new):
                updated[package] = new[package]

def main():
    parser = argparse.ArgumentParser(description='Update dependencies in package.json.')
    parser.add_argument('--set-version', dest='new_version', type=str, required=True, help='New version to set for JupyterLab dependencies')
    
    args = parser.parse_args()
    update_package_json(args.new_version)


if(__name__ == "__main__"):
    main()