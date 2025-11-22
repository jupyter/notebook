#!/usr/bin/env bash
set -euo pipefail

echo "[thesis] setting up notebook...";

echo " * rm py venv";
rm -rf ./.venv;

echo " * rm node deps";
rm -rf ./node_modules ./packages/*/node_modules;

echo " * make py venv";
python3 -m venv ./.venv;

echo " * sourcing py venv";
source ./.venv/bin/activate;

echo " * upgrade pip";
pip install --upgrade pip;

echo " * installing python deps";
pip install -e ".[dev,docs,test]"

echo " * build node";
./.venv/bin/jlpm install
./.venv/bin/jlpm build;

echo " * run node develop";
./.venv/bin/jlpm develop

echo " * enable jupyter notebook extension";
./.venv/bin/jupyter server extension enable notebook;

echo "[thesis] notebook setup complete"
