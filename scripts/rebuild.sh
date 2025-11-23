#!/usr/bin/env bash
set -euo pipefail

echo "[thesis] setting up notebook...";

echo " * rm py venv";
rm -rf ./.venv;

echo " * rm build libs";
find ./packages -type d -name "lib" -prune -exec rm -rf {} +
rm -rf buildutils/lib

echo " * rm build tsconfig.tsbuildinfo";
find ./packages -name "tsconfig.tsbuildinfo" -type f -delete
rm -f buildutils/tsconfig.tsbuildinfo

echo " * rm node deps";
rm -rf ./node_modules ./packages/*/node_modules buildutils/node_modules;

echo " * make py venv";
python3 -m venv ./.venv;

echo " * sourcing py venv";
source ./.venv/bin/activate;

echo " * upgrade pip";
pip install --upgrade pip;

echo " * installing python deps";
# Install build requirements manually to allow --no-build-isolation
pip install "hatchling>=1.11" "jupyterlab>=4.5.0rc0,<4.6" "hatch-jupyter-builder>=0.5" "editables"

# Disable build hooks to prevent premature frontend build
export HATCH_BUILD_HOOKS_ENABLE=false
export HATCH_BUILD_NO_HOOKS=true
export JUPYTER_PACKAGING_SKIP_NPM=1

pip install --no-build-isolation -e ".[dev,docs,test]"

unset HATCH_BUILD_HOOKS_ENABLE
unset HATCH_BUILD_NO_HOOKS
unset JUPYTER_PACKAGING_SKIP_NPM

echo " * build node";
./.venv/bin/jlpm install

# Patch lib0 types to fix Uint8Array generic error
echo " * patching lib0 types";
find . -type f -name "encoding.d.ts" -path "*/lib0/*" -exec perl -pi -e 's/Uint8Array<[^>]+>/Uint8Array/g' {} +

./.venv/bin/jlpm build;

echo " * run node develop";
./.venv/bin/jlpm develop

echo " * enable jupyter notebook extension";
./.venv/bin/jupyter server extension enable notebook;

echo "[thesis] notebook setup complete"
