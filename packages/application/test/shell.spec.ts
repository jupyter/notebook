// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { ClassicShell } from '@jupyterlab-classic/application';

describe('Shell', () => {
  describe('#constructor()', () => {
    it('should create a LabShell instance', () => {
      const shell = new ClassicShell();
      expect(shell).toBeInstanceOf(ClassicShell);
    });
  });
});
