#!/bin/bash

# Copyright (c) 2026 Ananda Firmansyah.
# Licensed under the AEVUMDB COMMUNITY LICENSE, Version 1.0. See LICENSE file in the root directory.

##
## @file scripts/test.sh
## @brief Test wrapper script for AevumDB Node.js driver
##

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Delegate to implementation
bash "$PROJECT_ROOT/scripts/test/test.sh" "$@"
