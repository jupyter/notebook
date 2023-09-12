import { ReactWidget } from '@jupyterlab/apputils';

import { Notebook, NotebookActions } from '@jupyterlab/notebook';

import { ITranslator } from '@jupyterlab/translation';

import React, { useEffect, useState } from 'react';

/**
 * Check if a notebook is trusted
 * @param notebook The notebook to check
 * @returns true if the notebook is trusted, false otherwise
 */
const isTrusted = (notebook: Notebook): boolean => {
  const model = notebook.model;
  if (!model) {
    return false;
  }
  const cells = Array.from(model.cells);
  let total = 0;
  let trusted = 0;

  for (const currentCell of cells) {
    if (currentCell.type !== 'code') {
      continue;
    }
    total++;
    if (currentCell.trusted) {
      trusted++;
    }
  }

  return trusted === total;
};

/**
 * A React component to display the Trusted badge in the menu bar.
 * @param notebook The Notebook
 * @param translator The Translation service
 */
const TrustedButton = ({
  notebook,
  translator,
}: {
  notebook: Notebook;
  translator: ITranslator;
}): JSX.Element => {
  const trans = translator.load('notebook');
  const [trusted, setTrusted] = useState(isTrusted(notebook));

  const checkTrust = () => {
    const v = isTrusted(notebook);
    setTrusted(v);
  };

  const trust = async () => {
    await NotebookActions.trust(notebook, translator);
    checkTrust();
  };

  useEffect(() => {
    notebook.modelContentChanged.connect(checkTrust);
    notebook.activeCellChanged.connect(checkTrust);
    checkTrust();
    return () => {
      notebook.modelContentChanged.disconnect(checkTrust);
      notebook.activeCellChanged.disconnect(checkTrust);
    };
  });

  return (
    <button
      className={'jp-NotebookTrustedStatus'}
      style={!trusted ? { cursor: 'pointer' } : { cursor: 'help' }}
      onClick={() => !trusted && trust()}
      title={
        trusted
          ? trans.__('JavaScript enabled for notebook display')
          : trans.__('JavaScript disabled for notebook display')
      }
    >
      {trusted ? trans.__('Trusted') : trans.__('Not Trusted')}
    </button>
  );
};

/**
 * A namespace for TrustedComponent static methods.
 */
export namespace TrustedComponent {
  /**
   * Create a new TrustedComponent
   *
   * @param notebook The notebook
   * @param translator The translator
   */
  export const create = ({
    notebook,
    translator,
  }: {
    notebook: Notebook;
    translator: ITranslator;
  }): ReactWidget => {
    return ReactWidget.create(
      <TrustedButton notebook={notebook} translator={translator} />
    );
  };
}
