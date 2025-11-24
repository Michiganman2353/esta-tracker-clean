// Vitest setup file
// Tests are configured in vitest.config.ts

import '@testing-library/jest-dom';

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
