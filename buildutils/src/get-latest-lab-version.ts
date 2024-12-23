import * as fs from 'fs-extra';
import * as semver from 'semver';

function convertPythonVersion(version: string): string {
  return version
    .replace('a', '-alpha')
    .replace('b', '-beta')
    .replace('rc', '-rc');
}

function extractVersionFromReleases(
  releases: any,
  versionTag: string,
  currentVersion: string
): string | null {
  const npmCurrentVersion = convertPythonVersion(currentVersion);
  const isCurrentPreRelease = semver.prerelease(npmCurrentVersion) !== null;

  if (versionTag === 'latest') {
    // Find first version that is newer than current and matches pre-release criteria
    const release = releases.find((r: any) => {
      const version = r['tag_name'].substring(1); // Remove 'v' prefix for semver
      const npmVersion = convertPythonVersion(version);
      return (
        (isCurrentPreRelease || !r['prerelease']) &&
        semver.gte(npmVersion, npmCurrentVersion)
      );
    });
    return release ? release['tag_name'] : null;
  } else {
    // Find exact version match
    const release = releases.find((r: any) => r['tag_name'] === versionTag);
    return release ? release['tag_name'] : null;
  }
}

function extractCurrentJupyterLabVersion(): string {
  const toml = fs.readFileSync('pyproject.toml', 'utf8');
  const match = toml.match(/jupyterlab>=([^,]+)/);
  if (!match) {
    throw new Error('Could not find JupyterLab version in pyproject.toml');
  }
  return match[1];
}

async function findVersion(versionTag: string): Promise<string> {
  const url = 'https://api.github.com/repos/jupyterlab/jupyterlab/releases';
  const response = await fetch(url);
  if (!response.ok) {
    const error_message = `Failed to fetch package.json from ${url}. HTTP status code: ${response.status}`;
    throw new Error(error_message);
  }

  const currentVersion = extractCurrentJupyterLabVersion();

  const releases: any = await response.json();
  const version: string | null = extractVersionFromReleases(
    releases,
    versionTag,
    currentVersion
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
