import argparse
import sys

import requests

REPOSITORY = "jupyterlab"
ORGANIZATION = "jupyterlab"


def extract_version_from_releases(releases, version_tag):
    for release in releases:
        tag_name = release["tag_name"]
        if version_tag == "latest":
            if not release["prerelease"] and not release["draft"]:
                return tag_name

        elif version_tag == tag_name:
            return tag_name
    return None


def find_version(owner, repository, version_tag):
    url = f"https://api.github.com/repos/{owner}/{repository}/releases"

    response = requests.get(url, timeout=10)

    if response.status_code != 200:
        error_message = (
            f"Failed to fetch package.json from {url}. HTTP status code: {response.status_code}"
        )
        raise requests.HTTPError(error_message)

    releases = response.json()
    version = extract_version_from_releases(releases, version_tag)

    if version is None:
        error_message = "Invalid release tag"
        raise ValueError(error_message)
    return version[1:]


def main():
    parser = argparse.ArgumentParser(description="Update dependencies in package.json.")
    parser.add_argument(
        "--set-version", dest="version_tag", type=str, required=True, help="Set version tag"
    )

    args = parser.parse_args()

    result = find_version(owner=ORGANIZATION, repository=REPOSITORY, version_tag=args.version_tag)
    sys.stdout.write(result)
    sys.stdout.flush()


if __name__ == "__main__":
    main()
