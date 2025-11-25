#!/usr/bin/env bash
set -euo pipefail

echo "[thesis] starting notebook development server...";

echo " -> running thesis notebook development server...";
./.venv/bin/thesis notebook;
