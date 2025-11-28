/**
 * Key Rotation Scheduler Tests
 *
 * Tests for automated KMS key rotation.
 * Note: Tests for KMS-dependent methods are skipped as they require actual KMS credentials.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  KeyRotationScheduler,
  DEFAULT_ROTATION_CONFIG,
} from '../keyRotationScheduler';

describe('Key Rotation Scheduler', () => {
  let scheduler: KeyRotationScheduler;

  beforeEach(() => {
    scheduler = new KeyRotationScheduler();
  });

  describe('DEFAULT_ROTATION_CONFIG', () => {
    it('should have 90-day rotation period', () => {
      expect(DEFAULT_ROTATION_CONFIG.rotationPeriodDays).toBe(90);
    });

    it('should enable auto-rotation by default', () => {
      expect(DEFAULT_ROTATION_CONFIG.enableAutoRotation).toBe(true);
    });

    it('should retain old versions by default', () => {
      expect(DEFAULT_ROTATION_CONFIG.retainOldVersions).toBe(true);
    });

    it('should keep 5 versions by default', () => {
      expect(DEFAULT_ROTATION_CONFIG.maxVersionsToKeep).toBe(5);
    });

    it('should enable notification by default', () => {
      expect(DEFAULT_ROTATION_CONFIG.notifyOnRotation).toBe(true);
    });
  });

  describe('KeyRotationScheduler constructor', () => {
    it('should use default config', () => {
      const config = scheduler.getConfig();
      expect(config).toEqual(DEFAULT_ROTATION_CONFIG);
    });

    it('should allow config overrides', () => {
      const customScheduler = new KeyRotationScheduler({
        rotationPeriodDays: 60,
      });
      const config = customScheduler.getConfig();
      expect(config.rotationPeriodDays).toBe(60);
      expect(config.enableAutoRotation).toBe(true); // Other defaults preserved
    });

    it('should allow multiple config overrides', () => {
      const customScheduler = new KeyRotationScheduler({
        rotationPeriodDays: 45,
        maxVersionsToKeep: 10,
        notifyOnRotation: false,
      });
      const config = customScheduler.getConfig();
      expect(config.rotationPeriodDays).toBe(45);
      expect(config.maxVersionsToKeep).toBe(10);
      expect(config.notifyOnRotation).toBe(false);
    });
  });

  describe('calculateNextRotation', () => {
    it('should calculate 90 days from now by default', () => {
      const now = new Date('2025-01-01');
      const next = scheduler.calculateNextRotation(now);

      expect(next.getTime()).toBe(new Date('2025-04-01').getTime());
    });

    it('should respect custom rotation period', () => {
      const customScheduler = new KeyRotationScheduler({
        rotationPeriodDays: 30,
      });
      const now = new Date('2025-01-01');
      const next = customScheduler.calculateNextRotation(now);

      expect(next.getTime()).toBe(new Date('2025-01-31').getTime());
    });

    it('should handle end of month correctly', () => {
      const now = new Date('2025-01-31');
      const next = scheduler.calculateNextRotation(now);

      // 90 days from Jan 31 = May 1
      expect(next.getMonth()).toBe(4); // May (0-indexed)
    });

    it('should handle leap year', () => {
      const now = new Date('2024-02-29'); // Leap year
      const next = scheduler.calculateNextRotation(now);

      expect(next.getFullYear()).toBe(2024);
      expect(next.getMonth()).toBe(4); // May
    });
  });

  describe('updateConfig', () => {
    it('should update rotation period', () => {
      scheduler.updateConfig({ rotationPeriodDays: 45 });
      const config = scheduler.getConfig();

      expect(config.rotationPeriodDays).toBe(45);
    });

    it('should preserve other config values', () => {
      scheduler.updateConfig({ rotationPeriodDays: 45 });
      const config = scheduler.getConfig();

      expect(config.enableAutoRotation).toBe(true);
      expect(config.retainOldVersions).toBe(true);
    });

    it('should allow disabling auto-rotation', () => {
      scheduler.updateConfig({ enableAutoRotation: false });
      const config = scheduler.getConfig();

      expect(config.enableAutoRotation).toBe(false);
    });

    it('should allow changing max versions', () => {
      scheduler.updateConfig({ maxVersionsToKeep: 10 });
      const config = scheduler.getConfig();

      expect(config.maxVersionsToKeep).toBe(10);
    });
  });

  describe('getRotationHistory', () => {
    it('should return empty array initially', () => {
      const history = scheduler.getRotationHistory();
      expect(history).toEqual([]);
    });

    it('should return a copy (not original)', () => {
      const history1 = scheduler.getRotationHistory();
      const history2 = scheduler.getRotationHistory();

      expect(history1).not.toBe(history2);
      expect(history1).toEqual(history2);
    });
  });

  describe('getConfig', () => {
    it('should return a copy (not original)', () => {
      const config1 = scheduler.getConfig();
      const config2 = scheduler.getConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });

    it('should not allow mutation of internal config', () => {
      const config = scheduler.getConfig();
      config.rotationPeriodDays = 999;

      const newConfig = scheduler.getConfig();
      expect(newConfig.rotationPeriodDays).toBe(90); // Unchanged
    });
  });
});
