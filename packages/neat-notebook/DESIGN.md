---
version: alpha
name: Neat Notebook
description: A quiet instrument ribbon above the active Jupyter notebook cell.
omitted:
  - section: colors
    reason: Jupyter theme variables are the canonical runtime colors; no fixed palette is introduced.
  - section: typography
    reason: Jupyter supplies the UI font family and size, including locale fallbacks.
  - section: rounded
    reason: The ribbon uses the host border radius; small inputs inherit the existing 2px treatment.
spacing:
  ribbon-gap: 8px
  compact-gap: 6px
  minimum-height: 28px
  vertical-padding: 2px
components:
  inspector: {}
  task-label: {}
  details-disclosure: {}
---

# Neat Notebook design contract

## Direction and ownership

An instrument label attached to a notebook cell, not an application shell or a
new brand skin. Researchers and notebook authors need the active cell's purpose
and execution state without losing their place. Preserve the existing Jupyter
interaction language in both Notebook and JupyterLab. No market-specific visual
assumptions are made; strings use Jupyter's translator with English fallback.

This document mirrors the host's canonical tokens (Model B); it does not generate
or replace them. `style/base.css` is the component styling source of truth.

| Role                     | Runtime token or treatment                                               |
| ------------------------ | ------------------------------------------------------------------------ |
| Surface and text         | `--jp-layout-color2`, `--jp-ui-font-color1`                              |
| Border and signature     | `--jp-border-color1`, 3px `--jp-brand-color1` start border               |
| Editable label and focus | `--jp-brand-color1`, visible 2px outline                                 |
| Running and modified     | `--jp-info-color1`, `--jp-warn-color1`, plus explicit text               |
| Typography               | `--jp-ui-font-family`, `--jp-ui-font-size0`, 20px line height            |
| Timing                   | Tabular digits; no animation; ticks excluded from the polite live region |
| Elevation and shape      | `--jp-elevation-z2`, `--jp-border-radius`                                |

Light and dark palettes remain entirely host-owned. Do not introduce hardcoded
colors, alternate fonts, custom scrollbars, or decorative motion.

## Layout and interaction

The inspected cell owns one sticky row above its input wrapper. It never overlays
the editor or changes the action toolbar. Use the existing prompt gutter on
desktop. At 760px and below, use a 6px gap and a details disclosure for secondary
information. Flex wrapping is content-driven, not forced by a breakpoint: one
row where it fits, two rows at the tested 240px narrow width. Long task labels
truncate without horizontal overflow. Printing hides the whole ribbon.

Native buttons provide keyboard actions. The task input saves on Enter/blur,
cancels on Escape, and leaves IME composition alone. Keyboard save/cancel returns
focus to the task button. Read-only cells disable the label button. The details
button exposes `aria-expanded` and `aria-controls`, and Escape closes it.
Only state transitions enter the polite live region, not per-second timer ticks.

## Canonical UI Map

| Capability | Canonical owner                  | Source of truth            | Allowed variants                                           | Verification                                   |
| ---------- | -------------------------------- | -------------------------- | ---------------------------------------------------------- | ---------------------------------------------- |
| Form       | CellInspector inline task editor | src/index.ts               | Save, cancel, clear, read-only; no separate form framework | Browser keyboard and metadata tests            |
| Scrollbar  | Host notebook widget             | JupyterLab Notebook layout | No extension-owned scrolling surface                       | Sticky-position and narrow-width browser tests |

## Boundaries and failure states

Only the currently tracked notebook displays a ribbon. The running cell retains
it while Jupyter advances selection or queues another cell; execution does not
change focus or selection. On completion, error, or interruption, ownership
passes to the next running cell, or the selected cell if none are running.
Switching tabs, deleting a cell, disabling the setting, and disposing a notebook
must remove the previous widget and timer. Timing stays in memory and is not
written to the document. Kernel errors remain owned and displayed by Jupyter;
the ribbon reports the model's execution state rather than inventing a new error
system. A failed settings load is logged and preserves the enabled default.

Do preserve unrelated metadata and the host's toolbar. Do keep text alongside
status colors. Do not add a new navigation surface, notification system, or
framework dependency for this single component.
