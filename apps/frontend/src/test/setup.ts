// Vitest setup file
// Tests are configured in vitest.config.ts

import '@testing-library/jest-dom';

/**
 * Global Firebase Mock
 * 
 * The @esta/firebase package detects test environments (via VITEST env var)
 * and returns null for Firebase instances to allow proper mocking.
 * 
 * Individual test files that need Firebase should add their own vi.mock() calls
 * to provide specific mock implementations. Example:
 * 
 * ```typescript
 * vi.mock('@esta/firebase', () => ({
 *   app: {},
 *   auth: { currentUser: null },
 *   db: {},
 *   storage: {},
 *   analytics: null,
 *   // Add any specific functions your tests need
 * }));
 * ```
 * 
 * For more complete mocks, use the testing utilities:
 * ```typescript
 * import { mockApp, mockAuth, mockDb, mockStorage } from '@esta/firebase/testing';
 * ```
 */

// Polyfill for File.arrayBuffer() in jsdom environment
// jsdom's File doesn't have arrayBuffer() method, so we add it
if (typeof File !== 'undefined' && !File.prototype.arrayBuffer) {
  // Adding polyfill for missing method in jsdom
  File.prototype.arrayBuffer = async function(this: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}
