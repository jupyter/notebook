# Compatibility patches

## JupyterLab shortcuts 5.5.0-alpha.2

The shortcuts plugin subscribes to settings changes before its initial settings
load completes. Another plugin can finish loading in that interval, causing the
listener to read the shortcuts schema before it exists.

The version-scoped patch defers those early notifications to the initial settings
load, which already incorporates the available plugins. Later settings changes
keep the upstream behavior. Both the distributed JavaScript and TypeScript source
are patched.

`Notebook startup registers shortcut settings without errors` exercises this
startup path in Chromium and Firefox. Remove the patch when upgrading to an
upstream version that guards or postpones this listener.
