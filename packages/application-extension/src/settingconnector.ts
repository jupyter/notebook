// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ISettingRegistry,
  SettingConnector as BaseSettingConnector,
} from '@jupyterlab/settingregistry';

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
 * This connector extends the default JupyterLab setting connector,
 * and additionally overrides the default values of some settings.
 */
export class SettingConnector extends BaseSettingConnector {
  /**
   * Fetch settings for a plugin.
   * @param id - The plugin ID
   */
  override async fetch(
    id: string
  ): Promise<ISettingRegistry.IPlugin | undefined> {
    const plugin = await super.fetch(id);
    return plugin && Private.overrideDefaults(plugin);
  }

  override async list(query: 'ids'): Promise<{ ids: string[] }>;
  override async list(
    query: 'active' | 'all'
  ): Promise<{ ids: string[]; values: ISettingRegistry.IPlugin[] }>;
  override async list(
    query: 'active' | 'all' | 'ids' = 'all'
  ): Promise<{ ids: string[]; values?: ISettingRegistry.IPlugin[] }> {
    if (query === 'ids') {
      return super.list(query);
    }
    const { ids, values } = await super.list(query);
    return { ids, values: values.map(Private.overrideDefaults) };
  }
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
