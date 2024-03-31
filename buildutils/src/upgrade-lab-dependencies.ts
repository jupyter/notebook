import fs from 'fs';
import path from 'path';

const PACKAGE_JSON_PATHS: string[] = [
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
];

const DEPENDENCY_GROUP: string = "@jupyterlab";

async function updatePackageJson(newVersion: string): Promise<void> {
    const url: string = `https://raw.githubusercontent.com/jupyterlab/jupyterlab/v${newVersion}/jupyterlab/staging/package.json`;
    const response = await fetch(url);

    if (!response.ok) {
        const errorMessage: string = `Failed to fetch package.json from ${url}. HTTP status code: ${response.status}`;
        throw new Error(errorMessage);
    }

    const newPackageJson = await response.json();

    for (const packageJsonPath of PACKAGE_JSON_PATHS) {
        const filePath: string = path.resolve(packageJsonPath);
        const existingPackageJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        const newDependencies = {
            ...newPackageJson.devDependencies,
            ...newPackageJson.resolutions
        };

        updateDependencyVersion(existingPackageJson, newDependencies);

        fs.writeFileSync(filePath, JSON.stringify(existingPackageJson, null, 2));
    }
}

function updateDependencyVersion(existingJson: any, newJson: any): void {
    if (!existingJson) {
        return;
    }

    const sectionPaths: string[] = ["resolutions", "dependencies", "devDependencies"];

    for (const section of sectionPaths) {
        if (!existingJson[section]) {
            continue;
        }

        const updated = existingJson[section];

        for (const [pkg, version] of Object.entries<string>(existingJson[section])) {
            if (pkg.startsWith(DEPENDENCY_GROUP) && pkg in newJson) {
                if (version[0] === '^' || version[0] === '~') {
                    updated[pkg] = version[0] + absoluteVersion(newJson[pkg]);
                } else {
                    updated[pkg] = absoluteVersion(newJson[pkg]);
                }
            }
        }
    }
}

function absoluteVersion(version: string): string {
    if (version.length > 0 && (version[0] === '^' || version[0] === '~')) {
        return version.substring(1);
    }
    return version;
}

async function upgradeLabDependencies(): Promise<void> {
    const args: string[] = process.argv.slice(2);

    if (args.length !== 2 || args[0] !== '--set-version') {
        console.error('Usage: node script.js --set-version <version>');
        process.exit(1);
    }

    const newVersion: string = args[1];
    await updatePackageJson(newVersion);
}

upgradeLabDependencies();
