// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  INotebookShell,
  NotebookShell,
  Shell
} from '@jupyter-notebook/application';

import { JupyterFrontEnd } from '@jupyterlab/application';

import { toArray } from '@lumino/algorithm';
import { Widget } from '@lumino/widgets';

describe('Shell for notebooks', () => {
  let shell: INotebookShell;
  let sidePanelsVisibleSpy: jest.SpyInstance;

  beforeEach(() => {
    shell = new NotebookShell();
    sidePanelsVisibleSpy = jest
      .spyOn(shell, 'sidePanelsVisible')
      .mockImplementation(() => {
        return true;
      });
    Widget.attach(shell, document.body);
  });

  afterEach(() => {
    sidePanelsVisibleSpy.mockRestore();
    shell.dispose();
  });

  describe('#constructor()', () => {
    it('should create a LabShell instance', () => {
      expect(shell).toBeInstanceOf(NotebookShell);
    });

    it('should make all areas empty initially', () => {
      ['main', 'top', 'left', 'right', 'menu'].forEach(area =>
        expect(shell.isEmpty(area as Shell.Area)).toBe(true)
      );
    });
  });

  describe('#widgets()', () => {
    it('should add widgets to main area', () => {
      const widget = new Widget();
      shell.add(widget, 'main');
      const widgets = toArray(shell.widgets('main'));
      expect(widgets).toEqual([widget]);
    });

    it('should throw an exception if the area does not exist', () => {
      const jupyterFrontEndShell = shell as JupyterFrontEnd.IShell;
      expect(() => {
        jupyterFrontEndShell.widgets('fake');
      }).toThrow('Invalid area: fake');
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
      expect(shell.isEmpty('top')).toBe(false);
    });

    it('should accept options', () => {
      const widget = new Widget();
      widget.id = 'foo';
      shell.add(widget, 'top', { rank: 10 });
      expect(shell.isEmpty('top')).toBe(false);
    });
  });

  describe('#add(widget, "main")', () => {
    it('should add a widget to the main area', () => {
      const widget = new Widget();
      widget.id = 'foo';
      shell.add(widget, 'main');
      expect(shell.isEmpty('main')).toBe(false);
    });
  });

  describe('#add(widget, "left")', () => {
    it('should add a widget to the left area', () => {
      const widget = new Widget();
      widget.id = 'foo';
      shell.add(widget, 'left');
      expect(shell.isEmpty('left')).toBe(false);
    });
  });

  describe('#add(widget, "right")', () => {
    it('should add a widget to the right area', () => {
      const widget = new Widget();
      widget.id = 'foo';
      shell.add(widget, 'right');
      expect(shell.isEmpty('right')).toBe(false);
    });
  });
});

describe('Shell for tree view', () => {
  let shell: INotebookShell;
  let sidePanelsVisibleSpy: jest.SpyInstance;

  beforeEach(() => {
    shell = new NotebookShell();
    sidePanelsVisibleSpy = jest
      .spyOn(shell, 'sidePanelsVisible')
      .mockImplementation(() => {
        return false;
      });
    Widget.attach(shell, document.body);
  });

  afterEach(() => {
    sidePanelsVisibleSpy.mockRestore();
    shell.dispose();
  });

  describe('#constructor()', () => {
    it('should create a LabShell instance', () => {
      expect(shell).toBeInstanceOf(NotebookShell);
    });

    it('should make all areas empty initially', () => {
      ['main', 'top', 'menu'].forEach(area =>
        expect(shell.isEmpty(area as Shell.Area)).toBe(true)
      );
    });
  });

  describe('#widgets()', () => {
    it('should add widgets to existing areas', () => {
      const widget = new Widget();
      shell.add(widget, 'main');
      const widgets = toArray(shell.widgets('main'));
      expect(widgets).toEqual([widget]);
    });

    it('should throw an exception if a fake area does not exist', () => {
      const jupyterFrontEndShell = shell as JupyterFrontEnd.IShell;
      expect(() => {
        jupyterFrontEndShell.widgets('fake');
      }).toThrow('Invalid area: fake');
    });

    it('should throw an exception if the left area does not exist', () => {
      const jupyterFrontEndShell = shell as JupyterFrontEnd.IShell;
      expect(() => {
        jupyterFrontEndShell.widgets('left');
      }).toThrow('Invalid area: left');
    });

    it('should throw an exception if the right area does not exist', () => {
      const jupyterFrontEndShell = shell as JupyterFrontEnd.IShell;
      expect(() => {
        jupyterFrontEndShell.widgets('right');
      }).toThrow('Invalid area: right');
    });
  });

  describe('#add(widget, "left")', () => {
    it('should fail to add a widget to the left area', () => {
      const widget = new Widget();
      widget.id = 'foo';
      expect(() => {
        shell.add(widget, 'left');
      }).toThrow('left area is not available on this page');
    });
  });

  describe('#add(widget, "right")', () => {
    it('should fail to add a widget to the right area', () => {
      const widget = new Widget();
      widget.id = 'foo';
      expect(() => {
        shell.add(widget, 'right');
      }).toThrow('right area is not available on this page');
    });
  });
});
