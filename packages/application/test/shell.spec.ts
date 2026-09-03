// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { INotebookShell, NotebookShell } from '@jupyter-notebook/application';

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

    it('should make some areas empty initially', () => {
      ['main', 'left', 'right', 'menu'].forEach((area) => {
        const widgets = Array.from(shell.widgets(area as INotebookShell.Area));
        expect(widgets.length).toEqual(0);
      });
    });

    it('should have the skip link widget in the top area initially', () => {
      const widgets = Array.from(shell.widgets('top'));
      expect(widgets.length).toEqual(1);
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

    it('should make some areas empty initially', () => {
      ['main', 'left', 'right', 'menu'].forEach((area) => {
        const widgets = Array.from(shell.widgets(area as INotebookShell.Area));
        expect(widgets.length).toEqual(0);
      });
    });

    it('should have the skip link widget in the top area initially', () => {
      const widgets = Array.from(shell.widgets('top'));
      expect(widgets.length).toEqual(1);
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

  describe('#skipToMain', () => {
    it('should focus the notebook input area editor if present', () => {
      const widget = new Widget();
      const editor = document.createElement('div');
      editor.className = 'jp-InputArea-editor';
      widget.node.appendChild(editor);
      shell.add(widget, 'main');

      const skipLink = shell.node.querySelector(
        '#jp-skiplink a'
      ) as HTMLAnchorElement;
      expect(skipLink).not.toBeNull();

      skipLink.click();
      expect(document.activeElement).toBe(editor);
      expect(editor.tabIndex).toBe(1);
    });

    it('should focus the directory listing content in tree view when editor is absent', () => {
      const widget = new Widget();
      const dirListing = document.createElement('div');
      dirListing.className = 'jp-DirListing-content';
      widget.node.appendChild(dirListing);
      shell.add(widget, 'main');

      const skipLink = shell.node.querySelector(
        '#jp-skiplink a'
      ) as HTMLAnchorElement;
      expect(skipLink).not.toBeNull();

      skipLink.click();
      expect(document.activeElement).toBe(dirListing);
      expect(dirListing.tabIndex).toBe(1);
    });

    it('should focus CodeMirror content if present when editor is absent', () => {
      const widget = new Widget();
      const cmContent = document.createElement('div');
      cmContent.className = 'cm-content';
      cmContent.tabIndex = 0;
      widget.node.appendChild(cmContent);
      shell.add(widget, 'main');

      const skipLink = shell.node.querySelector(
        '#jp-skiplink a'
      ) as HTMLAnchorElement;
      expect(skipLink).not.toBeNull();

      skipLink.click();
      expect(document.activeElement).toBe(cmContent);
    });

    it('should focus the current widget node if specific content classes are absent', () => {
      const widget = new Widget();
      shell.add(widget, 'main');

      const skipLink = shell.node.querySelector(
        '#jp-skiplink a'
      ) as HTMLAnchorElement;
      expect(skipLink).not.toBeNull();

      skipLink.click();
      expect(document.activeElement).toBe(widget.node);
      expect(widget.node.tabIndex).toBe(1);
    });

    it('should focus main panel without throwing if main area is empty', () => {
      const skipLink = shell.node.querySelector(
        '#jp-skiplink a'
      ) as HTMLAnchorElement;
      expect(skipLink).not.toBeNull();

      expect(() => {
        skipLink.click();
      }).not.toThrow();

      const mainPanel = document.querySelector('#main-panel');
      expect(document.activeElement).toBe(mainPanel);
    });
  });
});
