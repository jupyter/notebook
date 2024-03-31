function extractVersionFromReleases(
  releases: any,
  versionTag: string
): string | null {
  for (const release of releases) {
    const tagName: string = release['tag_name'];
    if (versionTag === 'latest') {
      if (!release['prerelease'] && !release['draft']) {
        return tagName;
      }
    } else if (versionTag === tagName) {
      return tagName;
    }
  }
  return null;
}

async function findVersion(versionTag: string): Promise<string> {
  const url = 'https://api.github.com/repos/jupyterlab/jupyterlab/releases';
  const response = await fetch(url);
  if (!response.ok) {
    const error_message = `Failed to fetch package.json from ${url}. HTTP status code: ${response.status}`;
    throw new Error(error_message);
  }
  const releases: any = await response.json();
  const version: string | null = extractVersionFromReleases(
    releases,
    versionTag
  );
  if (version === null) {
    const error_message = 'Invalid release tag';
    throw new Error(error_message);
  }
  return version.substring(1);
}

async function getLatestLabVersion(): Promise<void> {
  const args: string[] = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== '--set-version') {
    console.error('Usage: node script.js --set-version <version>');
    process.exit(1);
  }
  const version_tag: string = args[1];

  try {
    const result: string = await findVersion(version_tag);
    console.log(result);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

getLatestLabVersion();
