// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// Inspired by: https://github.com/jupyterlab/jupyterlab/blob/master/dev_mode/index.js

import { PageConfig, URLExt } from '@jupyterlab/coreutils';

require('./style.js');
require('./extraStyle.js');

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const newScript = document.createElement('script');
    newScript.onerror = reject;
    newScript.onload = resolve;
    newScript.async = true;
    document.head.appendChild(newScript);
    newScript.src = url;
  });
}
async function loadComponent(url, scope) {
  await loadScript(url);

  // From MIT-licensed https://github.com/module-federation/module-federation-examples/blob/af043acd6be1718ee195b2511adf6011fba4233c/advanced-api/dynamic-remotes/app1/src/App.js#L6-L12
  // eslint-disable-next-line no-undef
  await __webpack_init_sharing__('default');
  const container = window._JUPYTERLAB[scope];
  // Initialize the container, it may provide shared modules and may need ours
  // eslint-disable-next-line no-undef
  await container.init(__webpack_share_scopes__.default);
}

async function createModule(scope, module) {
  try {
    const factory = await window._JUPYTERLAB[scope].get(module);
    return factory();
  } catch (e) {
    console.warn(
      `Failed to create module: package: ${scope}; module: ${module}`
    );
    throw e;
  }
}

/**
 * The main function
 */
async function main() {
  // load extra packages
  require('@jupyterlab/celltags');

  const mimeExtensionsMods = [
    require('@jupyterlab/javascript-extension'),
    require('@jupyterlab/json-extension'),
    require('@jupyterlab/pdf-extension'),
    require('@jupyterlab/vega5-extension')
  ];
  const mimeExtensions = await Promise.all(mimeExtensionsMods);

  const disabled = [];
  // TODO: formalize the way the set of initial extensions and plugins are specified
  let baseMods = [
    // @jupyter-notebook plugins
    require('@jupyter-notebook/application-extension'),
    require('@jupyter-notebook/console-extension'),
    require('@jupyter-notebook/docmanager-extension'),
    require('@jupyter-notebook/documentsearch-extension'),
    require('@jupyter-notebook/help-extension'),
    require('@jupyter-notebook/notebook-extension'),
    // to handle opening new tabs after creating a new terminal
    require('@jupyter-notebook/terminal-extension'),

    // @jupyterlab plugins
    require('@jupyterlab/application-extension').default.filter(({ id }) =>
      [
        '@jupyterlab/application-extension:commands',
        '@jupyterlab/application-extension:context-menu',
        '@jupyterlab/application-extension:faviconbusy'
      ].includes(id)
    ),
    require('@jupyterlab/apputils-extension').default.filter(({ id }) =>
      [
        '@jupyterlab/apputils-extension:palette',
        '@jupyterlab/apputils-extension:settings',
        '@jupyterlab/apputils-extension:state',
        '@jupyterlab/apputils-extension:themes',
        '@jupyterlab/apputils-extension:themes-palette-menu',
        '@jupyterlab/apputils-extension:toolbar-registry'
      ].includes(id)
    ),
    require('@jupyterlab/codemirror-extension').default.filter(({ id }) =>
      [
        '@jupyterlab/codemirror-extension:services',
        '@jupyterlab/codemirror-extension:codemirror'
      ].includes(id)
    ),
    require('@jupyterlab/completer-extension').default.filter(({ id }) =>
      [
        '@jupyterlab/completer-extension:base-service',
        '@jupyterlab/completer-extension:tracker'
      ].includes(id)
    ),
    require('@jupyterlab/console-extension').default.filter(({ id }) =>
      [
        '@jupyterlab/console-extension:completer',
        '@jupyterlab/console-extension:factory',
        '@jupyterlab/console-extension:foreign',
        '@jupyterlab/console-extension:tracker'
      ].includes(id)
    ),
    require('@jupyterlab/docmanager-extension').default.filter(({ id }) =>
      [
        '@jupyterlab/docmanager-extension:plugin',
        '@jupyterlab/docmanager-extension:download'
      ].includes(id)
    ),
    require('@jupyterlab/docprovider-extension'),
    require('@jupyterlab/documentsearch-extension').default.filter(({ id }) =>
      ['@jupyterlab/documentsearch-extension:plugin'].includes(id)
    ),
    require('@jupyterlab/filebrowser-extension').default.filter(({ id }) =>
      ['@jupyterlab/filebrowser-extension:factory'].includes(id)
    ),
    require('@jupyterlab/fileeditor-extension').default.filter(({ id }) =>
      ['@jupyterlab/fileeditor-extension:plugin'].includes(id)
    ),
    require('@jupyterlab/mainmenu-extension'),
    require('@jupyterlab/markedparser-extension'),
    require('@jupyterlab/mathjax2-extension'),
    require('@jupyterlab/notebook-extension').default.filter(({ id }) =>
      [
        '@jupyterlab/notebook-extension:code-console',
        '@jupyterlab/notebook-extension:export',
        '@jupyterlab/notebook-extension:factory',
        '@jupyterlab/notebook-extension:tracker',
        '@jupyterlab/notebook-extension:widget-factory'
      ].includes(id)
    ),
    require('@jupyterlab/rendermime-extension'),
    require('@jupyterlab/shortcuts-extension'),
    // so new terminals can be create from the menu
    require('@jupyterlab/terminal-extension'),
    require('@jupyterlab/theme-light-extension'),
    require('@jupyterlab/theme-dark-extension'),
    require('@jupyterlab/translation-extension'),
    // Add the "Hub Control Panel" menu option when running in JupyterHub
    require('@jupyterlab/user-extension'),
    require('@jupyterlab/hub-extension')
  ];

  // The motivation here is to only load a specific set of plugins dependending on
  // the current page
  const page = PageConfig.getOption('notebookPage');
  switch (page) {
    case 'tree': {
      baseMods = baseMods.concat([
        require('@jupyterlab/filebrowser-extension').default.filter(({ id }) =>
          [
            '@jupyterlab/filebrowser-extension:browser',
            '@jupyterlab/filebrowser-extension:download',
            '@jupyterlab/filebrowser-extension:file-upload-status',
            '@jupyterlab/filebrowser-extension:open-with',
            '@jupyterlab/filebrowser-extension:share-file'
          ].includes(id)
        ),
        require('@jupyter-notebook/tree-extension'),
        require('@jupyterlab/running-extension')
      ]);
      break;
    }
    case 'notebooks': {
      baseMods = baseMods.concat([
        require('@jupyterlab/notebook-extension').default.filter(({ id }) =>
          ['@jupyterlab/notebook-extension:completer'].includes(id)
        ),
        require('@jupyterlab/tooltip-extension').default.filter(({ id }) =>
          [
            '@jupyterlab/tooltip-extension:manager',
            '@jupyterlab/tooltip-extension:notebooks'
          ].includes(id)
        )
      ]);
      break;
    }
    case 'consoles': {
      baseMods = baseMods.concat([
        require('@jupyterlab/tooltip-extension').default.filter(({ id }) =>
          [
            '@jupyterlab/tooltip-extension:manager',
            '@jupyterlab/tooltip-extension:consoles'
          ].includes(id)
        )
      ]);
      break;
    }
    case 'edit': {
      baseMods = baseMods.concat([
        require('@jupyterlab/fileeditor-extension').default.filter(({ id }) =>
          ['@jupyterlab/fileeditor-extension:completer'].includes(id)
        ),
        require('@jupyterlab/filebrowser-extension').default.filter(({ id }) =>
          ['@jupyterlab/filebrowser-extension:browser'].includes(id)
        )
      ]);
      break;
    }
  }

  /**
   * Iterate over active plugins in an extension.
   *
   * #### Notes
   * This also populates the disabled
   */
  function* activePlugins(extension) {
    // Handle commonjs or es2015 modules
    let exports;
    if (Object.prototype.hasOwnProperty.call(extension, '__esModule')) {
      exports = extension.default;
    } else {
      // CommonJS exports.
      exports = extension;
    }

    let plugins = Array.isArray(exports) ? exports : [exports];
    for (let plugin of plugins) {
      if (PageConfig.Extension.isDisabled(plugin.id)) {
        disabled.push(plugin.id);
        continue;
      }
      yield plugin;
    }
  }

  const extension_data = JSON.parse(
    PageConfig.getOption('federated_extensions')
  );

  const mods = [];
  const federatedExtensionPromises = [];
  const federatedMimeExtensionPromises = [];
  const federatedStylePromises = [];

  const extensions = await Promise.allSettled(
    extension_data.map(async data => {
      await loadComponent(
        `${URLExt.join(
          PageConfig.getOption('fullLabextensionsUrl'),
          data.name,
          data.load
        )}`,
        data.name
      );
      return data;
    })
  );

  extensions.forEach(p => {
    if (p.status === 'rejected') {
      // There was an error loading the component
      console.error(p.reason);
      return;
    }

    const data = p.value;
    if (data.extension) {
      federatedExtensionPromises.push(createModule(data.name, data.extension));
    }
    if (data.mimeExtension) {
      federatedMimeExtensionPromises.push(
        createModule(data.name, data.mimeExtension)
      );
    }
    if (data.style) {
      federatedStylePromises.push(createModule(data.name, data.style));
    }
  });

  // Add the base frontend extensions
  const baseFrontendMods = await Promise.all(baseMods);
  baseFrontendMods.forEach(p => {
    for (let plugin of activePlugins(p)) {
      mods.push(plugin);
    }
  });

  // Add the federated extensions.
  const federatedExtensions = await Promise.allSettled(
    federatedExtensionPromises
  );
  federatedExtensions.forEach(p => {
    if (p.status === 'fulfilled') {
      for (let plugin of activePlugins(p.value)) {
        mods.push(plugin);
      }
    } else {
      console.error(p.reason);
    }
  });

  // Add the federated mime extensions.
  const federatedMimeExtensions = await Promise.allSettled(
    federatedMimeExtensionPromises
  );
  federatedMimeExtensions.forEach(p => {
    if (p.status === 'fulfilled') {
      for (let plugin of activePlugins(p.value)) {
        mimeExtensions.push(plugin);
      }
    } else {
      console.error(p.reason);
    }
  });

  // Load all federated component styles and log errors for any that do not
  (await Promise.allSettled(federatedStylePromises))
    .filter(({ status }) => status === 'rejected')
    .forEach(({ reason }) => {
      console.error(reason);
    });

  const NotebookApp = require('@jupyter-notebook/application').NotebookApp;
  const app = new NotebookApp({ mimeExtensions });

  app.registerPluginModules(mods);

  // Expose global app instance when in dev mode or when toggled explicitly.
  const exposeAppInBrowser =
    (PageConfig.getOption('exposeAppInBrowser') || '').toLowerCase() === 'true';

  if (exposeAppInBrowser) {
    window.jupyterapp = app;
  }

  await app.start();
}

window.addEventListener('load', main);
