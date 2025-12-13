/**
 * Vitest Setup File
 *
 * Global test utilities and configuration for unit & integration tests
 */

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with @testing-library/jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Note: NODE_ENV is already set by the test runner

// Global test utilities
export const mockEnv = (vars: Record<string, string>) => {
  Object.entries(vars).forEach(([key, value]) => {
    process.env[key] = value;
  });
};

export const restoreEnv = (vars: string[]) => {
  vars.forEach(key => {
    delete process.env[key];
  });
};
