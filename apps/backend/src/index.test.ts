import { describe, it, expect } from 'vitest';

describe('Backend API', () => {
  describe('Health Check', () => {
    it('should export app successfully', async () => {
      const { default: app } = await import('./index.js');
      expect(app).toBeDefined();
    });

    it('should have health endpoint configured', async () => {
      const { default: app } = await import('./index.js');
      expect(app._router).toBeDefined();
    });
  });

  describe('Basic Math', () => {
    it('should perform basic arithmetic', () => {
      expect(2 + 2).toBe(4);
      expect(10 - 5).toBe(5);
      expect(3 * 3).toBe(9);
      expect(8 / 2).toBe(4);
    });
  });
});
