from urllib.request import urlopen
import json
import argparse


REPOSITORY = "jupyterlab"
ORGANIZATION = "jupyterlab"


def find_latest_stable(owner, repository, releaseVersion):
    """Find latest stable release on GitHub for given repository."""
    endpoint = f"https://api.github.com/repos/{owner}/{repository}/releases"
    releases = json.loads(urlopen(endpoint).read())
    for release in releases:
        # skip drafts and pre-releases
        if release['draft']:
            continue
        
        # if prerelease 
        if releaseVersion == 'prerelease' and release['prerelease']:
            name = release['tag_name']
        
        # For invalid release version input, latest will be considered by default.
        else:
            name = release['tag_name']

        if not name.startswith('v'):
            raise ValueError('Unexpected release tag name format: does not start with v')
        return name[1:]

def main():
    parser = argparse.ArgumentParser(description='Update dependencies in package.json.')
    parser.add_argument('--set-release', dest='version_release', type=str, required=True, help='Set release version')
    
    args = parser.parse_args()
    
    print(find_latest_stable(owner=ORGANIZATION,repository=REPOSITORY,releaseVersion=args.version_release))
    
if __name__ == '__main__':   
    main()