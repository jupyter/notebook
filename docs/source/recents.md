# Recent Documents

The `Recents` tab on the main page lists the documents that were recently
opened, with the time they were last opened, so they can quickly be opened
again without navigating the file browser.

```{image} ./_static/images/recents.png

```

## The Recents tab

- Click on a document to open it in a new browser tab.
- Hover over a document and click `Forget` to remove it from the list, or use
  `Forget All` to clear the list.
- The list is updated live: documents opened on other pages appear when
  returning to the tab, and the refresh button re-reads the list on demand.
- Documents that no longer exist on disk are automatically removed from the
  list.

## The File menu

On the notebook and editor pages, the `File > Open Recent` submenu lists the
same documents, along with a `Clear Recent Documents` entry.

## Where the list is stored

The list of recent documents is stored in the browser local storage, so it is
shared across the Jupyter Notebook pages and persists across sessions for the
same server. It is not stored on the server: clearing the browser data clears
the list, and other browsers or machines have their own list.

## Configuration

The maximum number of recent documents to keep can be configured with the
`maxNumberRecents` setting of the document manager, for example in the
settings overrides:

```json
{
  "@jupyterlab/docmanager-extension:plugin": {
    "maxNumberRecents": 20
  }
}
```
