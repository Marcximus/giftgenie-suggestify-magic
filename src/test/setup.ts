import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Make vi available globally
global.vi = vi;

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});