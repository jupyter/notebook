// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { PageConfig } from '@jupyterlab/coreutils';

import type {
  ISettingConnector,
  ISettingRegistry,
} from '@jupyterlab/settingregistry';

import type { IDataConnector } from '@jupyterlab/statedb';

import { DataConnector } from '@jupyterlab/statedb';

import { Throttler } from '@lumino/polling';

/**
 * The default setting values overridden in Jupyter Notebook, mapping
 * a plugin identifier to the overridden properties.
 */
const SETTING_OVERRIDES: {
  [pluginId: string]: {
    [propertyName: string]: ISettingRegistry.IProperty['default'];
  };
} = {
  // Use a different set of file browser defaults than JupyterLab.
  '@jupyterlab/filebrowser-extension:browser': {
    showFileCheckboxes: true,
    showFileSizeColumn: true,
    singleClickNavigation: true,
    sortNotebooksFirst: true,
  },
  // Open the help (pager payloads) in the down area by default,
  // like in the Classic Notebook.
  '@jupyterlab/notebook-extension:tracker': {
    helpInBottomPanel: true,
  },
};

/**
 * A data connector for fetching settings.
 *
 * #### Notes
 * This connector is based on the default JupyterLab setting connector,
 * and additionally overrides the default values of some settings.
 */
export class SettingConnector
  extends DataConnector<ISettingRegistry.IPlugin, string>
  implements ISettingConnector
{
  constructor(connector: IDataConnector<ISettingRegistry.IPlugin, string>) {
    super();
    this._connector = connector;
  }

  /**
   * Fetch settings for a plugin.
   * @param id - The plugin ID
   *
   * #### Notes
   * The REST API requests are throttled at one request per plugin per 100ms.
   */
  fetch(id: string): Promise<ISettingRegistry.IPlugin | undefined> {
    const throttlers = this._throttlers;
    if (!(id in throttlers)) {
      throttlers[id] = new Throttler(async () => {
        const plugin = await this._connector.fetch(id);
        return plugin && Private.overrideDefaults(plugin);
      }, 100);
    }
    return throttlers[id].invoke();
  }

  override async list(query: 'ids'): Promise<{ ids: string[] }>;
  override async list(
    query: 'active' | 'all'
  ): Promise<{ ids: string[]; values: ISettingRegistry.IPlugin[] }>;
  override async list(
    query: 'active' | 'all' | 'ids' = 'all'
  ): Promise<{ ids: string[]; values?: ISettingRegistry.IPlugin[] }> {
    const { isDisabled } = PageConfig.Extension;
    const { ids, values } = await this._connector.list(
      query === 'ids' ? 'ids' : undefined
    );

    if (query === 'ids') {
      return { ids };
    }

    if (query === 'all') {
      return { ids, values: values.map(Private.overrideDefaults) };
    }

    return {
      ids: ids.filter((id) => !isDisabled(id)),
      values: values
        .filter(({ id }) => !isDisabled(id))
        .map(Private.overrideDefaults),
    };
  }

  override async save(id: string, raw: string): Promise<void> {
    await this._connector.save(id, raw);
  }

  private _connector: IDataConnector<ISettingRegistry.IPlugin, string>;
  private _throttlers: { [key: string]: Throttler } = Object.create(null);
}

/**
 * A namespace for private module data.
 */
namespace Private {
  /**
   * Override the default values of the plugin settings listed
   * in `SETTING_OVERRIDES`.
   */
  export function overrideDefaults(
    plugin: ISettingRegistry.IPlugin
  ): ISettingRegistry.IPlugin {
    const overrides = SETTING_OVERRIDES[plugin.id];
    const properties = plugin.schema.properties;
    if (!overrides || !properties) {
      return plugin;
    }
    for (const [property, value] of Object.entries(overrides)) {
      if (property in properties) {
        properties[property].default = value;
      }
    }
    return plugin;
  }
}
