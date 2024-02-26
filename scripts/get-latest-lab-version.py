from urllib.request import urlopen
import json
import argparse


REPOSITORY = "jupyterlab"
ORGANIZATION = "jupyterlab"


def extract_version_from_releases(releases, version_tag):
    for release in releases:
        tag_name = release['tag_name']
        if (version_tag == "latest"):
            if(not release['prerelease'] and not release['draft']):
                return tag_name
        
        elif (version_tag == tag_name):
            return tag_name
    return None


def find_version(owner, repository, version_tag):
    """Find latest stable release on GitHub for given repository."""
    endpoint = f"https://api.github.com/repos/{owner}/{repository}/releases"
    releases = json.loads(urlopen(endpoint).read())

    version = extract_version_from_releases(releases,version_tag)

    if version is None:
        raise ValueError('Invalid release tag')
    if not version.startswith('v'):
        raise ValueError('Unexpected release tag name format: does not start with v')
    return version[1:]

def main():
    parser = argparse.ArgumentParser(description='Update dependencies in package.json.')
    parser.add_argument('--set-version', dest='version_tag', type=str, required=True, help='Set version tag')
    
    args = parser.parse_args()
    print(find_version(owner=ORGANIZATION,repository=REPOSITORY,version_tag=args.version_tag))
    

if __name__ == '__main__':   
    main()