#!/bin/bash

# Copyright (c) 2026 Ananda Firmansyah.
# Licensed under the AEVUMDB COMMUNITY LICENSE, Version 1.0. See LICENSE file in the root directory.

##
## @file scripts/format/format.sh
## @brief Format implementation for AevumDB Node.js driver
##

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo ""
echo "Formatting @aevumdb/node-driver"
echo ""

cd "$PROJECT_ROOT"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  pnpm install
fi

# Check if --check flag is passed
if [[ "$@" == *"--check"* ]]; then
  echo "Checking format (no changes)..."
  pnpm run format:check
else
  echo "Formatting code..."
  pnpm run format
  echo "Code formatted!"
fi
