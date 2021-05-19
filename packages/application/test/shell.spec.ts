// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { RetroShell, IRetroShell } from '@retrolab/application';

import { JupyterFrontEnd } from '@jupyterlab/application';

import { toArray } from '@lumino/algorithm';

import { Widget } from '@lumino/widgets';

describe('Shell', () => {
  let shell: IRetroShell;

  beforeEach(() => {
    shell = new RetroShell();
    Widget.attach(shell, document.body);
  });

  afterEach(() => {
    shell.dispose();
  });

  describe('#constructor()', () => {
    it('should create a LabShell instance', () => {
      expect(shell).toBeInstanceOf(RetroShell);
    });
  });

  describe('#widgets()', () => {
    it('should add widgets to existing areas', () => {
      const widget = new Widget();
      shell.add(widget, 'main');
      const widgets = toArray(shell.widgets('main'));
      expect(widgets).toEqual([widget]);
    });

    it('should throw an exception if the area does not exist', () => {
      const jupyterFrontEndShell = shell as JupyterFrontEnd.IShell;
      expect(() => {
        jupyterFrontEndShell.widgets('left');
      }).toThrow('Invalid area: left');
    });
  });

  describe('#currentWidget', () => {
    it('should be the current widget in the shell main area', () => {
      expect(shell.currentWidget).toBe(undefined);
      const widget = new Widget();
      widget.node.tabIndex = -1;
      widget.id = 'foo';
      expect(shell.currentWidget).toBe(undefined);
      shell.add(widget, 'main');
      expect(shell.currentWidget).toBe(widget);
      widget.parent = null;
      expect(shell.currentWidget).toBe(undefined);
    });
  });

  describe('#add(widget, "top")', () => {
    it('should add a widget to the top area', () => {
      const widget = new Widget();
      widget.id = 'foo';
      shell.add(widget, 'top');
      const widgets = toArray(shell.widgets('top'));
      expect(widgets.length).toBeGreaterThan(0);
    });

    it('should accept options', () => {
      const widget = new Widget();
      widget.id = 'foo';
      shell.add(widget, 'top', { rank: 10 });
      const widgets = toArray(shell.widgets('top'));
      expect(widgets.length).toBeGreaterThan(0);
    });
  });

  describe('#add(widget, "main")', () => {
    it('should add a widget to the main area', () => {
      const widget = new Widget();
      widget.id = 'foo';
      shell.add(widget, 'main');
      const widgets = toArray(shell.widgets('main'));
      expect(widgets.length).toBeGreaterThan(0);
    });
  });
});
