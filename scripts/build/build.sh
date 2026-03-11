#!/bin/bash

# Copyright (c) 2026 Ananda Firmansyah.
# Licensed under the AEVUMDB COMMUNITY LICENSE, Version 1.0. See LICENSE file in the root directory.

##
## @file scripts/build/build.sh
## @brief Build implementation for AevumDB Node.js driver
##

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo ""
echo "Building @aevumdb/node-driver"
echo ""

cd "$PROJECT_ROOT"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  pnpm install
fi

# Build
echo "Building TypeScript..."
pnpm run build

echo ""
echo "Build complete!"
echo "Output: $PROJECT_ROOT/dist"
