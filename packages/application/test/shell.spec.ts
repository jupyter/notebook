// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { ClassicShell } from '@jupyterlab-classic/application';

import { JupyterFrontEnd } from '@jupyterlab/application';

import { toArray } from '@lumino/algorithm';

import { Widget } from '@lumino/widgets';

describe('Shell', () => {
  describe('#constructor()', () => {
    it('should create a LabShell instance', () => {
      const shell = new ClassicShell();
      expect(shell).toBeInstanceOf(ClassicShell);
    });
  });

  describe('#widgets()', () => {
    it('should add widgets to existing areas', () => {
      const shell = new ClassicShell();
      const widget = new Widget();
      shell.add(widget, 'main');
      const widgets = toArray(shell.widgets('main'));
      expect(widgets).toEqual([widget]);
    });

    it('should throw an exception if the area does not exist', () => {
      const classicShell = new ClassicShell();
      const shell = classicShell as JupyterFrontEnd.IShell;
      expect(() => {
        shell.widgets('left');
      }).toThrow('Invalid area: left');
    });
  });
});
