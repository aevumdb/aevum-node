#!/bin/bash

# Copyright (c) 2026 Ananda Firmansyah.
# Licensed under the AEVUMDB COMMUNITY LICENSE, Version 1.0. See LICENSE file in the root directory.

##
## @file scripts/lint/lint.sh
## @brief Lint implementation for AevumDB Node.js driver
##

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo ""
echo "Linting @aevumdb/node-driver"
echo ""

cd "$PROJECT_ROOT"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  pnpm install
fi

# Lint
echo "Checking ESLint..."
pnpm run lint "$@"

echo "Checking formatting..."
pnpm run format "$@"

echo ""
echo "Linting complete!"
