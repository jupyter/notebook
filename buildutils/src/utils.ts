import { getLernaPaths, readJSONFile, run } from '@jupyterlab/buildutils';

import fs from 'fs';
import path from 'path';
import semver from 'semver';

type DependencyField =
  | 'dependencies'
  | 'devDependencies'
  | 'peerDependencies'
  | 'optionalDependencies'
  | 'resolutions';

type PackageData = {
  name: string;
  private?: boolean;
  version?: string;
  [key: string]: any;
};

export type WorkspacePackage = {
  data: PackageData;
  name: string;
  packageJsonPath: string;
  packagePath: string;
  private: boolean;
};

const INTERNAL_DEPENDENCY_FIELDS: DependencyField[] = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
  'resolutions',
];

function writePackageJson(packageJsonPath: string, data: PackageData): boolean {
  const text = `${JSON.stringify(data, null, 2)}\n`;
  const original = fs
    .readFileSync(packageJsonPath, 'utf8')
    .replace(/\r\n/g, '\n');

  if (text === original) {
    return false;
  }

  fs.writeFileSync(packageJsonPath, text, 'utf8');

  return true;
}

function normalizeDependencySpecifier(
  current: string,
  version: string
): string {
  if (current.startsWith('workspace:')) {
    return current;
  }

  const prefix = current.match(/^[~^<>=]*/)?.[0] ?? '';

  return `${prefix}${version}`;
}

export function getWorkspacePackages(basePath = '.'): WorkspacePackage[] {
  return getLernaPaths(basePath)
    .sort()
    .map((packagePath) => {
      const packageJsonPath = path.join(packagePath, 'package.json');
      const data = readJSONFile(packageJsonPath) as PackageData;

      return {
        data,
        name: data.name,
        packageJsonPath,
        packagePath,
        private: data.private === true,
      };
    });
}

export function pythonVersionToJSVersion(version: string): string {
  const jsVersion = version
    .replace(/a(\d+)$/, '-alpha.$1')
    .replace(/b(\d+)$/, '-beta.$1')
    .replace(/rc(\d+)$/, '-rc.$1')
    .replace(/\.dev(\d+)$/, '-dev.$1');

  if (!semver.valid(jsVersion)) {
    throw new Error(
      `Invalid JavaScript version: ${jsVersion} (from Python version: ${version})`
    );
  }

  return jsVersion;
}

export function jsVersionToPythonVersion(version: string): string {
  const pythonVersion = version
    .replace(/-alpha\.(\d+)$/, 'a$1')
    .replace(/-beta\.(\d+)$/, 'b$1')
    .replace(/-rc\.(\d+)$/, 'rc$1')
    .replace(/-dev\.(\d+)$/, '.dev$1');

  if (!/^\d+\.\d+\.\d+((a|b|rc|\.dev)\d+)?$/.test(pythonVersion)) {
    throw new Error(`Invalid Python version: ${version}`);
  }

  return pythonVersion;
}

export function normalizeJSVersion(version: string): string {
  if (semver.valid(version)) {
    return version;
  }

  return pythonVersionToJSVersion(version);
}

export function syncWorkspaceVersions(version: string, basePath = '.'): void {
  const normalizedVersion = normalizeJSVersion(version);
  const workspaces = getWorkspacePackages(basePath);
  const internalPackageNames = new Set(workspaces.map((pkg) => pkg.name));

  for (const workspace of workspaces) {
    let changed = false;

    if (workspace.data.version !== normalizedVersion) {
      workspace.data.version = normalizedVersion;
      changed = true;
    }

    for (const field of INTERNAL_DEPENDENCY_FIELDS) {
      const dependencies = workspace.data[field];

      if (!dependencies) {
        continue;
      }

      for (const dependencyName of Object.keys(dependencies)) {
        if (!internalPackageNames.has(dependencyName)) {
          continue;
        }

        const current = dependencies[dependencyName];
        const next = normalizeDependencySpecifier(current, normalizedVersion);

        if (current !== next) {
          dependencies[dependencyName] = next;
          changed = true;
        }
      }
    }

    if (changed) {
      writePackageJson(workspace.packageJsonPath, workspace.data);
    }
  }
}

/**
 * Get the current version of notebook
 */
export function getPythonVersion(): string {
  const cmd = 'hatch version';
  const lines = run(cmd, { stdio: 'pipe' }, true).split('\n');
  return lines[lines.length - 1];
}

export function postbump(commit = true): void {
  // run the integrity
  run('jlpm integrity');

  const newPyVersion = getPythonVersion();

  // Commit changes.
  if (commit) {
    run(`git commit -am "Release ${newPyVersion}"`);
    run(`git tag ${newPyVersion}`);
  }
}
