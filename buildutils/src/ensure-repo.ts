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
 */
const SKIP_CSS: { [key: string]: string[] } = {};

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
    return readJSONFile(path.resolve('node_modules', name, 'package.json'));
  }
}

/**
 * Build the dependency graph of the local packages and their first order
 * dependencies.
 */
function getPackageGraph(
  pkgData: { [key: string]: any },
  pkgPaths: { [key: string]: string }
): DepGraph<any> {
  const graph = new DepGraph<any>();
  Object.keys(pkgData).forEach((name) => {
    graph.addNode(name, pkgData[name]);
    const deps: { [key: string]: string } = pkgData[name].dependencies ?? {};
    Object.keys(deps).forEach((depName) => {
      if (!graph.hasNode(depName)) {
        graph.addNode(
          depName,
          getDependencyData(pkgData, pkgPaths[name], depName)
        );
      }
      graph.addDependency(name, depName);
    });
  });
  return graph;
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
 */
async function ensureIntegrity(): Promise<boolean> {
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
  const depCache: { [key: string]: string } = {};
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
    const pkgMessages = await ensurePackage(options);
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

  if (Object.keys(messages).length > 0) {
    console.debug(JSON.stringify(messages, null, 2));
    if (process.argv.includes('--force')) {
      console.debug(
        '\n\nPlease run `jlpm integrity` locally and commit the changes'
      );
      process.exit(1);
    }
    run('jlpm');
    console.debug('\n\nMade integrity changes; please commit the changes');
    return false;
  }

  console.debug('Repo integrity verified!');
  return true;
}

if (require.main === module) {
  void ensureIntegrity().catch((e) => {
    process.exitCode = 1;
    console.error(e);
  });
}
