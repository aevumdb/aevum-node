// Copyright (c) 2026 Ananda Firmansyah.
// Licensed under the AEVUMDB COMMUNITY LICENSE, Version 1.0. See LICENSE file in the root directory.

import type { Config } from 'jest';

const config: Config = {
  // Use ts-jest preset for TypeScript support.
  preset: 'ts-jest',
  // The test environment that will be used for testing. 'node' for Node.js environment.
  testEnvironment: 'node',
  // A list of paths to directories that Jest should use to search for files in.
  roots: ['<rootDir>/tests'],
  // An array of glob patterns indicating a set of files for which coverage information should be collected.
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  // An array of file extensions your modules use.
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // A list of glob patterns indicating a set of files for which coverage information should be collected.
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  // A configuration object that allows to enforce a minimum coverage threshold.
  coverageThreshold: {
    global: {
      branches: 45,
      functions: 45,
      lines: 45,
      statements: 45,
    },
  },
};

export default config;
