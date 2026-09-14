// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// Inspired by: https://github.com/jupyterlab/jupyterlab/blob/master/dev_mode/index.js

import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import { PluginRegistry } from '@lumino/coreutils';

import { Signal } from '@lumino/signaling';

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
    const instance = factory();
    instance.__scope__ = scope;
    return instance;
  } catch (e) {
    console.warn(
      `Failed to create module: package: ${scope}; module: ${module}`
    );
    throw e;
  }
}

const IDLE_TIMEOUT = 5000;

/**
 * Resolve once the browser is idle, or on the next task when
 * `requestIdleCallback` is not available (Safari before 16.4).
 */
function whenIdle() {
  return new Promise(resolve => {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => resolve(), { timeout: IDLE_TIMEOUT });
    } else {
      setTimeout(resolve, 0);
    }
  });
}

/**
 * The main function
 */
async function main() {
  const mimeExtensionsMods = [
  {{#each notebook_mime_extensions}}
    require('{{ @key }}'),
  {{/each}}
  ];
  const mimeExtensions = await Promise.all(mimeExtensionsMods);

  // Load the base plugins available on all pages
  let baseMods = [
  {{#each notebook_plugins}}
    {{#if (ispage @key '/')}}
      {{{ list_plugins }}}
    {{/if}}
  {{/each}}
  ];

  const page = `/${PageConfig.getOption('notebookPage')}`;
  switch (page) {
  {{#each notebook_plugins}}
    {{#unless (ispage @key '/')}}
    // list all the other plugins grouped by page
    case '{{ @key }}': {
      baseMods = baseMods.concat([
        {{{ list_plugins }}}
      ]);
      break;
    }
    {{/unless}}
  {{/each}}
  }

  // populate the list of disabled extensions
  const disabled = [];
  const availablePlugins = [];

  // A package listed in `disabledExtensions` is disabled as a unit, including
  // its plugins whose id does not start with the package name.
  const isExtensionDisabled = name => {
    return PageConfig.Extension.disabled.includes(name);
  };

  const warnAboutPackageLevelDisable = (pluginId, scope) => {
    console.warn(
      `Plugin ${pluginId} does not start with the name of the extension providing it (${scope}), which is disabled, so this plugin is disabled too. To keep it enabled, list the plugin ids to disable in disabledExtensions instead of ${scope}.`
    );
  };

  function getPlugins(extension) {
    // Handle commonjs or es2015 modules
    let exports;
    if (Object.prototype.hasOwnProperty.call(extension, '__esModule')) {
      exports = extension.default;
    } else {
      // CommonJS exports.
      exports = extension;
    }
    return Array.isArray(exports) ? exports : [exports];
  }

  function createPluginInfo(plugin, extension, isDisabled) {
    return {
      id: plugin.id,
      description: plugin.description,
      requires: plugin.requires ?? [],
      optional: plugin.optional ?? [],
      provides: plugin.provides ?? null,
      autoStart: plugin.autoStart,
      enabled: !isDisabled,
      extension: extension.__scope__
    };
  }

  function recordPlugin(plugin, extension, isDisabled) {
    availablePlugins.push(createPluginInfo(plugin, extension, isDisabled));
    if (isDisabled) {
      disabled.push(plugin.id);
    }
  }

  function collectDisabledPlugins(extension) {
    const plugins = [];
    for (let plugin of getPlugins(extension)) {
      if (!PageConfig.Extension.isDisabled(plugin.id)) {
        warnAboutPackageLevelDisable(plugin.id, extension.__scope__);
      }
      plugins.push(createPluginInfo(plugin, extension, true));
    }
    return plugins;
  }

  /**
   * Iterate over active plugins in an extension.
   *
   * #### Notes
   * This also populates the disabled
   */
  function* activePlugins(extension) {
    for (let plugin of getPlugins(extension)) {
      const disabledById = PageConfig.Extension.isDisabled(plugin.id);
      const isDisabled =
        disabledById || isExtensionDisabled(extension.__scope__);
      if (isDisabled && !disabledById) {
        warnAboutPackageLevelDisable(plugin.id, extension.__scope__);
      }
      recordPlugin(plugin, extension, isDisabled);
      if (isDisabled) {
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
  const deferredDisabledFederatedModules = [];

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
    const isDisabled = isExtensionDisabled(data.name);
    if (data.extension) {
      if (isDisabled) {
        deferredDisabledFederatedModules.push({
          name: data.name,
          module: data.extension
        });
      } else {
        federatedExtensionPromises.push(createModule(data.name, data.extension));
      }
    }
    if (data.mimeExtension) {
      if (isDisabled) {
        deferredDisabledFederatedModules.push({
          name: data.name,
          module: data.mimeExtension
        });
      } else {
        federatedMimeExtensionPromises.push(
          createModule(data.name, data.mimeExtension)
        );
      }
    }
    if (data.style && !isDisabled) {
      federatedStylePromises.push(createModule(data.name, data.style));
    }
  });

  // Only collects plugin metadata; disabled plugins must not be registered.
  async function loadDeferredDisabledFederatedPlugins() {
    const deferredDisabledFederatedPlugins = await Promise.allSettled(
      deferredDisabledFederatedModules.map(data =>
        createModule(data.name, data.module)
      )
    );
    const disabledPlugins = [];

    deferredDisabledFederatedPlugins.forEach(p => {
      if (p.status === 'fulfilled') {
        try {
          disabledPlugins.push(...collectDisabledPlugins(p.value));
        } catch (e) {
          console.error(e);
        }
      } else {
        console.error(p.reason);
      }
    });

    return disabledPlugins;
  }

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

  // Set the list of base notebook multi-page plugins so the app is aware of all
  // its built-in plugins even if they are not loaded on the current page.
  // For example this is useful so the Settings Editor can list the debugger
  // plugin even if the debugger is only loaded on the notebook page.
  PageConfig.setOption('allPlugins', '{{{ json notebook_plugins }}}');


  const pluginRegistry = new PluginRegistry();
  const NotebookApp = require('@jupyter-notebook/application').NotebookApp;

  pluginRegistry.registerPlugins(mods);
  const IServiceManager = require('@jupyterlab/services').IServiceManager;
  const serviceManager = await pluginRegistry.resolveRequiredService(IServiceManager);

  const availablePluginsAdded = new Signal({});

  const app = new NotebookApp({
    pluginRegistry,
    serviceManager,
    mimeExtensions,
    disabled: {
      matches: disabled,
      patterns: PageConfig.Extension.disabled
    },
    availablePlugins,
    availablePluginsAdded
  });

  // Expose global app instance when in dev mode or when toggled explicitly.
  const exposeAppInBrowser =
    (PageConfig.getOption('exposeAppInBrowser') || '').toLowerCase() === 'true';

  if (exposeAppInBrowser) {
    window.jupyterapp = app;
  }

  await app.start();

  // Keep the disabled extensions from competing with the startup work.
  app.restored
    .then(whenIdle)
    .then(loadDeferredDisabledFederatedPlugins)
    .then(plugins => {
      availablePluginsAdded.emit(plugins);
    })
    .catch(reason => {
      console.error('Error when loading disabled federated extensions:', reason);
    });
}

window.addEventListener('load', main);
