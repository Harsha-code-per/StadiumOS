#!/bin/bash
# Script to run backend unit tests
set -e

cd "$(dirname "$0")"

echo "Setting up Python virtual environment..."
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi

source .venv/bin/activate

echo "Installing requirements..."
pip install -r requirements.txt

echo "Running pytest..."
PYTHONPATH=. pytest tests/ -v
