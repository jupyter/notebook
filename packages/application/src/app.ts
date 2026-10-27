// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  JupyterLab,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { Base64ModelFactory } from '@jupyterlab/docregistry';

import { createRendermimePlugins } from '@jupyterlab/application/lib/mimerenderers';

import { LabStatus } from '@jupyterlab/application/lib/status';

import { PageConfig } from '@jupyterlab/coreutils';

import { IRenderMime } from '@jupyterlab/rendermime-interfaces';

import { Throttler } from '@lumino/polling';

import { ISignal, Signal } from '@lumino/signaling';

import { INotebookShell, NotebookShell } from './shell';

/**
 * App is the main application class. It is instantiated once and shared.
 */
export class NotebookApp extends JupyterFrontEnd<INotebookShell> {
  /**
   * Construct a new NotebookApp object.
   *
   * @param options The instantiation options for an application.
   */
  constructor(options: NotebookApp.IOptions = { shell: new NotebookShell() }) {
    super({ ...options, shell: options.shell ?? new NotebookShell() });

    // Add initial model factory.
    this.docRegistry.addModelFactory(new Base64ModelFactory());
    if (options.mimeExtensions) {
      for (const plugin of createRendermimePlugins(options.mimeExtensions)) {
        this.registerPlugin(plugin);
      }
    }

    // Create an IInfo dictionary from the options to override the defaults.
    const info = Object.keys(JupyterLab.defaultInfo).reduce((acc, val) => {
      if (val in options) {
        (acc as any)[val] = JSON.parse(JSON.stringify((options as any)[val]));
      }
      return acc;
    }, {} as Partial<JupyterLab.IInfo>);

    // Populate application info with own lists, as the plugins announced after
    // startup are appended in place.
    const appInfo: JupyterLab.IInfo = {
      ...JupyterLab.defaultInfo,
      availablePlugins: [],
      disabled: { patterns: [], matches: [] },
      ...info,
    };
    this._availablePluginsChanged = new Signal<JupyterLab.IInfo, void>(appInfo);
    this._info = Object.assign(appInfo, {
      availablePluginsChanged: this._availablePluginsChanged,
    });
    options.availablePluginsAdded?.connect(this._onAvailablePluginsAdded, this);

    this.restored = this.shell.restored;

    this.restored.then(() => this._formatter.invoke());
  }

  /**
   * The name of the application.
   */
  readonly name = 'Jupyter Notebook';

  /**
   * A namespace/prefix plugins may use to denote their provenance.
   */
  readonly namespace = this.name;

  /**
   * The application busy and dirty status signals and flags.
   */
  readonly status = new LabStatus(this);

  /**
   * Promise that resolves when the state is first restored
   */
  override readonly restored: Promise<void>;

  /**
   * The version of the application.
   */

  readonly version = PageConfig.getOption('appVersion') ?? 'unknown';

  /**
   * The NotebookApp application information dictionary.
   */
  get info(): NotebookApp.IAppInfo {
    return this._info;
  }

  /**
   * The JupyterLab application paths dictionary.
   */
  get paths(): JupyterFrontEnd.IPaths {
    return {
      urls: {
        base: PageConfig.getOption('baseUrl'),
        notFound: PageConfig.getOption('notFoundUrl'),
        app: PageConfig.getOption('appUrl'),
        static: PageConfig.getOption('staticUrl'),
        settings: PageConfig.getOption('settingsUrl'),
        themes: PageConfig.getOption('themesUrl'),
        doc: PageConfig.getOption('docUrl'),
        translations: PageConfig.getOption('translationsApiUrl'),
        hubHost: PageConfig.getOption('hubHost') || undefined,
        hubPrefix: PageConfig.getOption('hubPrefix') || undefined,
        hubUser: PageConfig.getOption('hubUser') || undefined,
        hubServerName: PageConfig.getOption('hubServerName') || undefined,
      },
      directories: {
        appSettings: PageConfig.getOption('appSettingsDir'),
        schemas: PageConfig.getOption('schemasDir'),
        static: PageConfig.getOption('staticDir'),
        templates: PageConfig.getOption('templatesDir'),
        themes: PageConfig.getOption('themesDir'),
        userSettings: PageConfig.getOption('userSettingsDir'),
        serverRoot: PageConfig.getOption('serverRoot'),
        workspaces: PageConfig.getOption('workspacesDir'),
      },
    };
  }

  /**
   * Handle the DOM events for the application.
   *
   * @param event - The DOM event sent to the application.
   */
  override handleEvent(event: Event): void {
    super.handleEvent(event);
    if (event.type === 'resize') {
      void this._formatter.invoke();
    }
  }

  /**
   * Register plugins from a plugin module.
   *
   * @param mod - The plugin module to register.
   */
  registerPluginModule(mod: NotebookApp.IPluginModule): void {
    let data = mod.default;
    // Handle commonjs exports.
    if (!Object.prototype.hasOwnProperty.call(mod, '__esModule')) {
      data = mod as any;
    }
    if (!Array.isArray(data)) {
      data = [data];
    }
    data.forEach((item) => {
      try {
        this.registerPlugin(item);
      } catch (error) {
        console.error(error);
      }
    });
  }

  /**
   * Register the plugins from multiple plugin modules.
   *
   * @param mods - The plugin modules to register.
   */
  registerPluginModules(mods: NotebookApp.IPluginModule[]): void {
    mods.forEach((mod) => {
      this.registerPluginModule(mod);
    });
  }

  /**
   * Add the announced plugins to the available plugins.
   */
  private _onAvailablePluginsAdded(
    sender: unknown,
    plugins: JupyterLab.IPluginInfo[]
  ): void {
    if (plugins.length === 0) {
      return;
    }
    const disabled = new Set(this._info.disabled.matches);
    for (const plugin of plugins) {
      this._info.availablePlugins.push(plugin);
      if (!plugin.enabled && !disabled.has(plugin.id)) {
        this._info.disabled.matches.push(plugin.id);
        disabled.add(plugin.id);
      }
    }
    this._availablePluginsChanged.emit();
  }

  private _info: NotebookApp.IAppInfo;
  private _availablePluginsChanged: Signal<JupyterLab.IInfo, void>;
  private _formatter = new Throttler(() => {
    Private.setFormat(this);
  }, 250);
}

/**
 * A namespace for App static items.
 */
export namespace NotebookApp {
  /**
   * The instantiation options for an App application.
   */
  export interface IOptions
    extends JupyterFrontEnd.IOptions<INotebookShell>,
      Partial<IInfo> {
    /**
     * A signal announcing plugins discovered after startup, such as those of
     * the disabled federated extensions; they are appended to `info`.
     */
    availablePluginsAdded?: ISignal<unknown, JupyterLab.IPluginInfo[]>;
  }

  /**
   * The information about a Jupyter Notebook application.
   */
  export interface IInfo {
    /**
     * The mime renderer extensions.
     */
    readonly mimeExtensions: IRenderMime.IExtensionModule[];

    /**
     * The information about available plugins.
     */
    readonly availablePlugins: JupyterLab.IPluginInfo[];

    /**
     * The collection of disabled extension patterns and matched extensions.
     */
    readonly disabled: { patterns: string[]; matches: string[] };
  }

  /**
   * The application information, with its change signal.
   */
  export interface IAppInfo extends JupyterLab.IInfo {
    /**
     * A signal emitted when `availablePlugins` changes.
     */
    readonly availablePluginsChanged: ISignal<JupyterLab.IInfo, void>;
  }

  /**
   * The interface for a module that exports a plugin or plugins as
   * the default value.
   */
  export interface IPluginModule {
    /**
     * The default export.
     */
    default: JupyterFrontEndPlugin<any> | JupyterFrontEndPlugin<any>[];
  }
}

/**
 * A namespace for module-private functionality.
 */
namespace Private {
  /**
   * Media query for mobile devices.
   */
  const MOBILE_QUERY = 'only screen and (max-width: 760px)';

  /**
   * Sets the `format` of a Jupyter front-end application.
   *
   * @param app The front-end application whose format is set.
   */
  export function setFormat(app: NotebookApp): void {
    app.format = window.matchMedia(MOBILE_QUERY).matches ? 'mobile' : 'desktop';
  }
}
