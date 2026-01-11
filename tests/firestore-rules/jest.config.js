const { createDefaultPreset } = require('ts-jest');

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  verbose: true,
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    ...tsJestTransformCfg,
  },
  collectCoverageFrom: ['**/*.ts', '!**/node_modules/**', '!jest.config.js'],
  // Set environment variables for Firebase emulator
  globals: {
    FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
    GCLOUD_PROJECT: 'nowastedmed-test',
  },
  // Ensure environment is set before tests
  setupFiles: ['./jest.setup.js'],
};
