import { builtinModules } from 'module';

import * as path from 'path';

import { DepGraph } from 'dependency-graph';

import * as fs from 'fs-extra';

import * as ts from 'typescript';

import {
  ensurePackage,
  getLernaPaths,
  IEnsurePackageOptions,
  readJSONFile,
  run,
  writePackageData,
} from '@jupyterlab/buildutils';

/**
 * Packages whose dependencies are not checked. The app package is a bundling
 * manifest: its dependencies list the extensions to include in the build.
 */
const SKIP_PACKAGES = ['@jupyter-notebook/app'];

/**
 * Node.js builtins imported without the `node:` prefix, per package.
 */
const MISSING: { [key: string]: string[] } = {
  '@jupyter-notebook/buildutils': ['fs', 'module', 'path', 'process'],
};

/**
 * Dependencies that may be declared without being imported, per package.
 */
const UNUSED: { [key: string]: string[] } = {
  // pulled in for their styles only
  '@jupyter-notebook/application': ['@jupyterlab/mainmenu'],
  '@jupyter-notebook/tree': ['@jupyterlab/filebrowser'],
};

/**
 * Dependencies allowed to differ from the range used elsewhere in the repo.
 */
const DIFFERENT_VERSIONS = [
  // the app package pins an older major version
  'fs-extra',
];

/**
 * Dependencies whose styles should not be imported, per package.
 *
 * These styles are already loaded by the application through other packages,
 * so importing them again would change the CSS cascade order in the app
 * bundle (and bundle duplicate assets in the federated lab extension).
 */
const SKIP_CSS: { [key: string]: string[] } = {
  '@jupyter-notebook/application': [
    '@jupyterlab/apputils',
    '@jupyterlab/docregistry',
    '@lumino/widgets',
  ],
  '@jupyter-notebook/application-extension': [
    '@jupyter-notebook/ui-components',
    '@jupyterlab/application',
    '@jupyterlab/apputils',
    '@jupyterlab/console',
    '@jupyterlab/docmanager',
    '@jupyterlab/docregistry',
    '@jupyterlab/mainmenu',
    '@jupyterlab/rendermime',
  ],
  '@jupyter-notebook/console-extension': [
    '@jupyter-notebook/application',
    '@jupyterlab/application',
    '@jupyterlab/apputils',
    '@jupyterlab/console',
    '@jupyterlab/notebook',
    '@jupyterlab/ui-components',
    '@lumino/widgets',
  ],
  '@jupyter-notebook/docmanager-extension': [
    '@jupyter-notebook/application',
    '@jupyterlab/application',
    '@jupyterlab/docmanager',
    '@jupyterlab/docregistry',
  ],
  '@jupyter-notebook/documentsearch-extension': [
    '@jupyter-notebook/application',
    '@jupyterlab/application',
    '@jupyterlab/documentsearch',
    '@lumino/widgets',
  ],
  '@jupyter-notebook/help-extension': [
    '@jupyter-notebook/ui-components',
    '@jupyterlab/application',
    '@jupyterlab/apputils',
    '@jupyterlab/mainmenu',
  ],
  // this federated extension runs in JupyterLab, which provides these styles
  '@jupyter-notebook/lab-extension': [
    '@jupyter-notebook/application',
    '@jupyterlab/application',
    '@jupyterlab/apputils',
    '@jupyterlab/notebook',
    '@jupyterlab/ui-components',
    '@lumino/widgets',
  ],
  '@jupyter-notebook/notebook-extension': [
    '@jupyter-notebook/application',
    '@jupyterlab/application',
    '@jupyterlab/apputils',
    '@jupyterlab/cells',
    '@jupyterlab/debugger',
    '@jupyterlab/docmanager',
    '@jupyterlab/docregistry',
    '@jupyterlab/mainmenu',
    '@jupyterlab/notebook',
    '@jupyterlab/toc',
    '@lumino/widgets',
  ],
  '@jupyter-notebook/terminal-extension': [
    '@jupyter-notebook/application',
    '@jupyterlab/application',
    '@jupyterlab/terminal',
  ],
  '@jupyter-notebook/tree': ['@jupyterlab/ui-components', '@lumino/widgets'],
  '@jupyter-notebook/tree-extension': [
    '@jupyterlab/application',
    '@jupyterlab/apputils',
    '@jupyterlab/running',
    '@jupyterlab/settingeditor',
    '@jupyterlab/ui-components',
    '@lumino/widgets',
  ],
  '@jupyter-notebook/ui-components': ['@jupyterlab/ui-components'],
};

/**
 * Extract the module specifiers imported by a source file.
 */
function getImports(filePath: string): string[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true
  );
  const specifiers: string[] = [];
  const visit = (node: ts.Node): void => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === 'require')) &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return specifiers;
}

/**
 * Resolve an import specifier to a package name.
 *
 * Returns null for relative imports and Node.js builtins.
 */
function getPackageName(specifier: string): string | null {
  if (specifier.startsWith('.') || specifier.startsWith('node:')) {
    return null;
  }
  const parts = specifier.split('/');
  const name = specifier.startsWith('@')
    ? parts.slice(0, 2).join('/')
    : parts[0];
  if (builtinModules.includes(name)) {
    return null;
  }
  return name;
}

/**
 * Read the package.json of a dependency, resolving from the dependent package.
 */
function getDependencyData(
  pkgData: { [key: string]: any },
  fromPath: string,
  name: string
): any {
  if (name in pkgData) {
    return pkgData[name];
  }
  try {
    return readJSONFile(
      require.resolve(`${name}/package.json`, { paths: [fromPath] })
    );
  } catch {
    try {
      return readJSONFile(path.resolve('node_modules', name, 'package.json'));
    } catch {
      return {};
    }
  }
}

/**
 * Build the dependency graph of the local packages and their transitive
 * dependencies, so that `dependenciesOf()` returns a proper topological
 * order for CSS imports (a dependency style always precedes its dependents).
 */
function getPackageGraph(
  pkgData: { [key: string]: any },
  pkgPaths: { [key: string]: string }
): DepGraph<any> {
  const graph = new DepGraph<any>({ circular: true });
  const addDependencies = (name: string, data: any, fromPath: string): void => {
    const deps: { [key: string]: string } = data.dependencies ?? {};
    Object.keys(deps).forEach((depName) => {
      const seen = graph.hasNode(depName);
      if (!seen) {
        graph.addNode(depName, getDependencyData(pkgData, fromPath, depName));
      }
      graph.addDependency(name, depName);
      if (!seen) {
        addDependencies(depName, graph.getNodeData(depName), fromPath);
      }
    });
  };
  Object.keys(pkgData).forEach((name) => {
    if (!graph.hasNode(name)) {
      graph.addNode(name, pkgData[name]);
    }
    addDependencies(name, pkgData[name], pkgPaths[name]);
  });
  return graph;
}

/**
 * Get the version range of the installed JupyterLab packages that no local
 * package depends on yet.
 *
 * `ensurePackage()` looks up the `latest` npm tag of a dependency that is not
 * declared anywhere in the repo, which does not match the JupyterLab
 * prerelease the repo is pinned to. The installed version does, since all the
 * `@jupyterlab/*` packages resolve to the same release.
 */
function getInstalledLabVersions(pkgData: { [key: string]: any }): {
  [key: string]: string;
} {
  const declared = new Set<string>();
  Object.values(pkgData).forEach((data) => {
    Object.keys({ ...data.dependencies, ...data.devDependencies }).forEach(
      (name) => declared.add(name)
    );
  });
  const versions: { [key: string]: string } = {};
  const labDir = path.resolve('node_modules', '@jupyterlab');
  if (!fs.existsSync(labDir)) {
    return versions;
  }
  fs.readdirSync(labDir).forEach((dir) => {
    const name = `@jupyterlab/${dir}`;
    const pkgJsonPath = path.join(labDir, dir, 'package.json');
    if (declared.has(name) || !fs.existsSync(pkgJsonPath)) {
      return;
    }
    versions[name] = `~${readJSONFile(pkgJsonPath).version}`;
  });
  return versions;
}

/**
 * Directories that `ensurePackage()` never writes to.
 */
const SKIP_DIRS = ['lib', 'node_modules'];

/**
 * Read the files of a package, keyed by their path relative to the package.
 *
 * `ensurePackage()` rewrites some files without reporting it (the
 * `tsconfig.json` references, the `@packageDocumentation` header of the entry
 * point...), so the files are compared before and after calling it.
 */
function readPackageFiles(pkgPath: string): Map<string, string> {
  const files = new Map<string, string>();
  const visit = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.includes(entry.name)) {
          visit(entryPath);
        }
      } else if (entry.isFile()) {
        files.set(
          path.relative(pkgPath, entryPath),
          fs.readFileSync(entryPath, 'utf8')
        );
      }
    }
  };
  visit(pkgPath);
  return files;
}

/**
 * List the files that changed between two snapshots of a package and are not
 * already mentioned in the messages returned by `ensurePackage()`.
 */
function getUnreportedChanges(
  before: Map<string, string>,
  after: Map<string, string>,
  reported: string[]
): string[] {
  const messages: string[] = [];
  const files = [...new Set([...before.keys(), ...after.keys()])].sort();
  for (const file of files) {
    if (
      before.get(file) === after.get(file) ||
      reported.some((message) => message.includes(file))
    ) {
      continue;
    }
    messages.push(`${after.has(file) ? 'Updated' : 'Removed'} ${file}`);
  }
  return messages;
}

/**
 * Ensure the root eslint config only imports declared devDependencies.
 */
function ensureRootDevDependencies(): string[] {
  const messages: string[] = [];
  const data = readJSONFile(path.resolve('package.json'));
  for (const specifier of getImports(path.resolve('eslint.config.mjs'))) {
    const name = getPackageName(specifier);
    if (name && !data.devDependencies[name]) {
      messages.push(
        `Missing root devDependency: ${name} (imported by eslint.config.mjs)`
      );
    }
  }
  return messages;
}

/**
 * Ensure the application package resolutions.
 */
function ensureResolutions(): string[] {
  const basePath = path.resolve('.');
  const corePath = path.join(basePath, 'app', 'package.json');
  const corePackage = fs.readJSONSync(corePath);

  corePackage.resolutions = {};

  const packages = Object.keys(corePackage.dependencies).concat(
    corePackage.jupyterlab.singletonPackages
  );

  packages.forEach(async (name) => {
    let version = '';
    try {
      const data = require(`${name}/package.json`);
      version = data.version;
    } catch {
      const modulePath = require.resolve(name);
      const parentDir = path.dirname(path.dirname(modulePath));
      const data = require(path.join(parentDir, 'package.json'));
      version = data.version;
    }
    // Insist on a restricted version in the yarn resolution.
    corePackage.resolutions[name] = `~${version}`;
  });

  // Write the package.json back to disk.
  if (writePackageData(corePath, corePackage)) {
    return ['Updated dev mode'];
  }
  return [];
}

/**
 * Ensure the repo integrity.
 *
 * @returns The changes made, per package.
 */
async function ensureIntegrity(): Promise<{ [key: string]: string[] }> {
  const messages: { [key: string]: string[] } = {};

  // Gather the package data.
  const pkgData: { [key: string]: any } = {};
  const pkgPaths: { [key: string]: string } = {};
  const locals: { [key: string]: string } = {};
  for (const pkgPath of getLernaPaths().sort()) {
    const data = readJSONFile(path.join(pkgPath, 'package.json'));
    pkgData[data.name] = data;
    pkgPaths[data.name] = pkgPath;
    locals[data.name] = pkgPath;
  }

  // Build up an ordered list of CSS imports for each local package.
  const graph = getPackageGraph(pkgData, pkgPaths);
  const cssImports: { [key: string]: string[] } = {};
  const cssModuleImports: { [key: string]: string[] } = {};
  Object.keys(locals).forEach((name) => {
    const data = pkgData[name];
    const deps: { [key: string]: string } = data.dependencies ?? {};
    const skip = SKIP_CSS[name] ?? [];
    const cssData: { [key: string]: string[] } = {
      ...data.jupyterlab?.extraStyles,
    };
    const cssModuleData: { [key: string]: string[] } = {
      ...data.jupyterlab?.extraStyles,
    };
    Object.keys(deps).forEach((depName) => {
      if (skip.includes(depName) || depName in cssData) {
        return;
      }
      const depData = graph.getNodeData(depName);
      if (typeof depData.style === 'string') {
        cssData[depName] = [depData.style];
      }
      if (typeof depData.styleModule === 'string') {
        cssModuleData[depName] = [depData.styleModule];
      } else if (typeof depData.style === 'string') {
        cssModuleData[depName] = [depData.style];
      }
    });
    // Get the CSS imports in dependency order.
    cssImports[name] = [];
    cssModuleImports[name] = [];
    graph.dependenciesOf(name).forEach((depName) => {
      if (depName in cssData) {
        cssData[depName].forEach((cssPath) => {
          cssImports[name].push(`${depName}/${cssPath}`);
        });
      }
      if (depName in cssModuleData) {
        cssModuleData[depName].forEach((cssModulePath) => {
          cssModuleImports[name].push(`${depName}/${cssModulePath}`);
        });
      }
    });
  });

  // Validate each package.
  const depCache = getInstalledLabVersions(pkgData);
  for (const name of Object.keys(locals)) {
    if (SKIP_PACKAGES.includes(name)) {
      continue;
    }
    const options: IEnsurePackageOptions = {
      pkgPath: pkgPaths[name],
      data: pkgData[name],
      depCache,
      missing: MISSING[name],
      unused: UNUSED[name] ?? [],
      locals,
      cssImports: cssImports[name],
      cssModuleImports: cssModuleImports[name],
      differentVersions: DIFFERENT_VERSIONS,
    };
    const before = readPackageFiles(pkgPaths[name]);
    const pkgMessages = await ensurePackage(options);
    const after = readPackageFiles(pkgPaths[name]);
    pkgMessages.push(...getUnreportedChanges(before, after, pkgMessages));
    if (pkgMessages.length > 0) {
      messages[name] = pkgMessages;
    }
  }

  const rootMessages = ensureRootDevDependencies();
  if (rootMessages.length > 0) {
    messages['root'] = rootMessages;
  }

  const resolutionMessages = ensureResolutions();
  if (resolutionMessages.length > 0) {
    messages['@jupyter-notebook/app'] = resolutionMessages;
  }

  return messages;
}

/**
 * Check the repo integrity, and fix it unless `--force` is passed.
 */
async function main(): Promise<void> {
  let messages = await ensureIntegrity();
  if (Object.keys(messages).length === 0) {
    console.debug('Repo integrity verified!');
    return;
  }
  console.debug(JSON.stringify(messages, null, 2));
  if (process.argv.includes('--force')) {
    console.debug(
      '\n\nPlease run `jlpm integrity` locally and commit the changes'
    );
    process.exit(1);
  }
  // A change can call for another one, e.g. a newly added dependency must be
  // installed and have its styles imported, so iterate until the repo is stable.
  for (let pass = 0; pass < 3 && Object.keys(messages).length > 0; pass++) {
    run('jlpm');
    messages = await ensureIntegrity();
    if (Object.keys(messages).length > 0) {
      console.debug(JSON.stringify(messages, null, 2));
    }
  }
  console.debug('\n\nMade integrity changes; please commit the changes');
}

if (require.main === module) {
  void main().catch((e) => {
    process.exitCode = 1;
    console.error(e);
  });
}
