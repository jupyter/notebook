// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  INotebookShell,
  NotebookShell,
  Shell
} from '@jupyter-notebook/application';

import { JupyterFrontEnd } from '@jupyterlab/application';

import { Widget } from '@lumino/widgets';

describe('Shell for notebooks', () => {
  let shell: INotebookShell;

  beforeEach(() => {
    shell = new NotebookShell();
    Widget.attach(shell, document.body);
  });

  afterEach(() => {
    shell.dispose();
  });

  describe('#constructor()', () => {
    it('should create a LabShell instance', () => {
      expect(shell).toBeInstanceOf(NotebookShell);
    });

    it('should make all areas empty initially', () => {
      ['main', 'top', 'left', 'right', 'menu'].forEach(area => {
        const widgets = Array.from(shell.widgets(area as Shell.Area));
        expect(widgets.length).toEqual(0);
      });
    });
  });

  describe('#widgets()', () => {
    it('should add widgets to main area', () => {
      const widget = new Widget();
      shell.add(widget, 'main');
      const widgets = Array.from(shell.widgets('main'));
      expect(widgets).toEqual([widget]);
    });

    it('should be empty and console.error if area does not exist', () => {
      const spy = jest.spyOn(console, 'error');
      const jupyterFrontEndShell = shell as JupyterFrontEnd.IShell;
      expect(Array.from(jupyterFrontEndShell.widgets('fake'))).toHaveLength(0);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('#currentWidget', () => {
    it('should be the current widget in the shell main area', () => {
      expect(shell.currentWidget).toBe(null);
      const widget = new Widget();
      widget.node.tabIndex = -1;
      widget.id = 'foo';
      expect(shell.currentWidget).toBe(null);
      shell.add(widget, 'main');
      expect(shell.currentWidget).toBe(widget);
      widget.parent = null;
      expect(shell.currentWidget).toBe(null);
    });
  });

  describe('#add(widget, "top")', () => {
    it('should add a widget to the top area', () => {
      const widget = new Widget();
      widget.id = 'foo';
      shell.add(widget, 'top');
      const widgets = Array.from(shell.widgets('top'));
      expect(widgets.length).toBeGreaterThan(0);
    });

    it('should accept options', () => {
      const widget = new Widget();
      widget.id = 'foo';
      shell.add(widget, 'top', { rank: 10 });
      const widgets = Array.from(shell.widgets('top'));
      expect(widgets.length).toBeGreaterThan(0);
    });
  });

  describe('#add(widget, "main")', () => {
    it('should add a widget to the main area', () => {
      const widget = new Widget();
      widget.id = 'foo';
      shell.add(widget, 'main');
      const widgets = Array.from(shell.widgets('main'));
      expect(widgets.length).toBeGreaterThan(0);
    });
  });

  describe('#add(widget, "left")', () => {
    it('should add a widget to the left area', () => {
      const widget = new Widget();
      widget.id = 'foo';
      shell.add(widget, 'left');
      const widgets = Array.from(shell.widgets('left'));
      expect(widgets.length).toBeGreaterThan(0);
    });
  });

  describe('#add(widget, "right")', () => {
    it('should add a widget to the right area', () => {
      const widget = new Widget();
      widget.id = 'foo';
      shell.add(widget, 'right');
      const widgets = Array.from(shell.widgets('right'));
      expect(widgets.length).toBeGreaterThan(0);
    });
  });
});

describe('Shell for tree view', () => {
  let shell: INotebookShell;

  beforeEach(() => {
    shell = new NotebookShell();
    Widget.attach(shell, document.body);
  });

  afterEach(() => {
    shell.dispose();
  });

  describe('#constructor()', () => {
    it('should create a LabShell instance', () => {
      expect(shell).toBeInstanceOf(NotebookShell);
    });

    it('should make all areas empty initially', () => {
      ['main', 'top', 'left', 'right', 'menu'].forEach(area => {
        const widgets = Array.from(shell.widgets(area as Shell.Area));
        expect(widgets.length).toEqual(0);
      });
    });
  });

  describe('#widgets()', () => {
    it('should add widgets to existing areas', () => {
      const widget = new Widget();
      shell.add(widget, 'main');
      const widgets = Array.from(shell.widgets('main'));
      expect(widgets).toEqual([widget]);
    });

    it('should throw an exception if a fake area does not exist', () => {
      const spy = jest.spyOn(console, 'error');
      const jupyterFrontEndShell = shell as JupyterFrontEnd.IShell;
      expect(Array.from(jupyterFrontEndShell.widgets('fake'))).toHaveLength(0);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('#add(widget, "left")', () => {
    it('should add a widget to the left area', () => {
      const widget = new Widget();
      widget.id = 'foo';
      shell.add(widget, 'left');
      const widgets = Array.from(shell.widgets('left'));
      expect(widgets.length).toBeGreaterThan(0);
    });
  });

  describe('#add(widget, "right")', () => {
    it('should add a widget to the right area', () => {
      const widget = new Widget();
      widget.id = 'foo';
      shell.add(widget, 'right');
      const widgets = Array.from(shell.widgets('right'));
      expect(widgets.length).toBeGreaterThan(0);
    });
  });
});
