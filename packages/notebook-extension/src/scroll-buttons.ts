// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { ITranslator } from '@jupyterlab/translation';

/**
 * The class name for the scroll buttons container
 */
const SCROLL_BUTTONS_CLASS = 'jp-Notebook-scrollButtons';

/**
 * The class name for individual scroll buttons
 */
const SCROLL_BUTTON_CLASS = 'jp-Notebook-scrollButton';

/**
 * The class name for hiding scroll buttons
 */
const SCROLL_BUTTONS_HIDDEN_CLASS = 'jp-mod-hidden';

/**
 * A plugin that adds scroll buttons to the notebook
 */
export const scrollButtons: JupyterFrontEndPlugin<void> = {
  id: '@jupyter-notebook/notebook-extension:scroll-buttons',
  description: 'A plugin that adds scroll buttons to the notebook.',
  autoStart: true,
  requires: [INotebookTracker],
  optional: [ITranslator],
  activate: (app: JupyterFrontEnd, tracker: INotebookTracker) => {
    // Create scroll buttons container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = SCROLL_BUTTONS_CLASS;

    // Create up button
    const upButton = document.createElement('button');
    upButton.className = SCROLL_BUTTON_CLASS;
    upButton.innerHTML = '↑';
    upButton.title = 'Scroll to top';
    upButton.onclick = () => {
      const notebook = tracker.currentWidget?.content;
      if (notebook) {
        notebook.node.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    };

    // Create down button
    const downButton = document.createElement('button');
    downButton.className = SCROLL_BUTTON_CLASS;
    downButton.innerHTML = '↓';
    downButton.title = 'Scroll to bottom';
    downButton.onclick = () => {
      const notebook = tracker.currentWidget?.content;
      if (notebook) {
        notebook.node.scrollTo({
          top: notebook.node.scrollHeight,
          behavior: 'smooth'
        });
      }
    };

    // Add buttons to container
    buttonContainer.appendChild(upButton);
    buttonContainer.appendChild(downButton);

    // Add container to document body
    document.body.appendChild(buttonContainer);

    // Show/hide buttons based on scroll position
    tracker.currentChanged.connect(() => {
      const notebook = tracker.currentWidget?.content;
      if (notebook) {
        const handleScroll = () => {
          const { scrollTop, scrollHeight, clientHeight } = notebook.node;
          buttonContainer.classList.toggle(
            SCROLL_BUTTONS_HIDDEN_CLASS,
            scrollHeight <= clientHeight
          );
        };
        notebook.node.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial check
      }
    });
  }
};
