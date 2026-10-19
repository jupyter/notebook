// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { NotebookApp, NotebookShell } from '@jupyter-notebook/application';

import { JupyterLab } from '@jupyterlab/application';

import { Signal } from '@lumino/signaling';

describe('NotebookApp', () => {
  function pluginInfo(id: string, enabled: boolean): JupyterLab.IPluginInfo {
    return {
      id,
      description: '',
      requires: [],
      optional: [],
      provides: null,
      autoStart: true,
      enabled,
      extension: id.split(':')[0],
    };
  }

  describe('#availablePluginsAdded', () => {
    it('should add the announced plugins and emit', () => {
      const added = new Signal<unknown, JupyterLab.IPluginInfo[]>({});
      const app = new NotebookApp({
        shell: new NotebookShell(),
        availablePlugins: [
          pluginInfo('@jupyter-notebook/a-extension:plugin', true),
        ],
        disabled: { patterns: ['@jupyter-notebook/b-extension'], matches: [] },
        availablePluginsAdded: added,
      });
      const slot = jest.fn();
      app.info.availablePluginsChanged.connect(slot);

      added.emit([
        pluginInfo('@jupyter-notebook/b-extension:plugin', false),
        pluginInfo('@jupyter-notebook/c-extension:plugin', true),
      ]);

      expect(slot).toHaveBeenCalledTimes(1);
      expect(slot.mock.calls[0][0]).toBe(app.info);
      expect(app.info.availablePlugins.map((plugin) => plugin.id)).toEqual([
        '@jupyter-notebook/a-extension:plugin',
        '@jupyter-notebook/b-extension:plugin',
        '@jupyter-notebook/c-extension:plugin',
      ]);
      expect(app.info.disabled.matches).toEqual([
        '@jupyter-notebook/b-extension:plugin',
      ]);
    });

    it('should add plugins announced more than once', () => {
      const added = new Signal<unknown, JupyterLab.IPluginInfo[]>({});
      const app = new NotebookApp({
        shell: new NotebookShell(),
        availablePluginsAdded: added,
      });
      const slot = jest.fn();
      app.info.availablePluginsChanged.connect(slot);

      added.emit([pluginInfo('@jupyter-notebook/a-extension:plugin', true)]);
      added.emit([pluginInfo('@jupyter-notebook/b-extension:plugin', false)]);

      expect(slot).toHaveBeenCalledTimes(2);
      expect(app.info.availablePlugins.map((plugin) => plugin.id)).toEqual([
        '@jupyter-notebook/a-extension:plugin',
        '@jupyter-notebook/b-extension:plugin',
      ]);
      expect(app.info.disabled.matches).toEqual([
        '@jupyter-notebook/b-extension:plugin',
      ]);
    });

    it('should not repeat a disabled plugin id', () => {
      const added = new Signal<unknown, JupyterLab.IPluginInfo[]>({});
      const app = new NotebookApp({
        shell: new NotebookShell(),
        disabled: {
          patterns: [],
          matches: ['@jupyter-notebook/b-extension:plugin'],
        },
        availablePluginsAdded: added,
      });

      added.emit([pluginInfo('@jupyter-notebook/b-extension:plugin', false)]);

      expect(app.info.disabled.matches).toEqual([
        '@jupyter-notebook/b-extension:plugin',
      ]);
    });

    it('should not emit when no plugin was announced', () => {
      const added = new Signal<unknown, JupyterLab.IPluginInfo[]>({});
      const app = new NotebookApp({
        shell: new NotebookShell(),
        availablePluginsAdded: added,
      });
      const slot = jest.fn();
      app.info.availablePluginsChanged.connect(slot);

      added.emit([]);

      expect(slot).not.toHaveBeenCalled();
      expect(app.info.availablePlugins).toEqual([]);
    });

    it('should not add the plugins to the default info', () => {
      const added = new Signal<unknown, JupyterLab.IPluginInfo[]>({});
      const app = new NotebookApp({
        shell: new NotebookShell(),
        availablePluginsAdded: added,
      });

      added.emit([pluginInfo('@jupyter-notebook/a-extension:plugin', false)]);

      expect(app.info.availablePlugins).toHaveLength(1);
      expect(app.info.disabled.matches).toHaveLength(1);
      expect(JupyterLab.defaultInfo.availablePlugins).toEqual([]);
      expect(JupyterLab.defaultInfo.disabled.matches).toEqual([]);
    });
  });
});
