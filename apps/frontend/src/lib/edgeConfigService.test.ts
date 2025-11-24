/**
 * Tests for Edge Config Service
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { EdgeConfigService } from '@/lib/edgeConfigService';
import { DEFAULT_EDGE_CONFIG } from '@/types/edgeConfig';

// Mock fetch globally
global.fetch = vi.fn() as Mock;

describe('EdgeConfigService', () => {
  let service: EdgeConfigService;

  beforeEach(() => {
    service = new EdgeConfigService();
    service.invalidateCache();
    vi.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should fetch config from API', async () => {
      const mockConfig = { ...DEFAULT_EDGE_CONFIG, maintenanceMode: true };
      
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      });

      const config = await service.getConfig();
      
      expect(config).toEqual(mockConfig);
      expect(global.fetch).toHaveBeenCalledWith('/api/edge-config');
    });

    it('should return default config if API fails', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const config = await service.getConfig();
      
      expect(config).toEqual(DEFAULT_EDGE_CONFIG);
    });

    it('should return default config on network error', async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      const config = await service.getConfig();
      
      expect(config).toEqual(DEFAULT_EDGE_CONFIG);
    });

    it('should cache config and reuse it', async () => {
      const mockConfig = { ...DEFAULT_EDGE_CONFIG };
      
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      });

      // First call
      await service.getConfig();
      
      // Second call (should use cache)
      await service.getConfig();
      
      // Fetch should only be called once due to caching
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFeatureFlag', () => {
    it('should return feature flag value', async () => {
      const mockConfig = {
        ...DEFAULT_EDGE_CONFIG,
        featureFlags: {
          ...DEFAULT_EDGE_CONFIG.featureFlags,
          doctorNotesEnabled: false,
        },
      };
      
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      });

      const flag = await service.getFeatureFlag('doctorNotesEnabled');
      
      expect(flag).toBe(false);
    });

    it('should return default value if flag is missing', async () => {
      const mockConfig = {
        ...DEFAULT_EDGE_CONFIG,
        featureFlags: {},
      };
      
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      });

      const flag = await service.getFeatureFlag('doctorNotesEnabled');
      
      expect(flag).toBe(DEFAULT_EDGE_CONFIG.featureFlags.doctorNotesEnabled);
    });
  });

  describe('isMaintenanceMode', () => {
    it('should return true when in maintenance mode', async () => {
      const mockConfig = {
        ...DEFAULT_EDGE_CONFIG,
        maintenanceMode: true,
      };
      
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      });

      const isMaintenanceMode = await service.isMaintenanceMode();
      
      expect(isMaintenanceMode).toBe(true);
    });

    it('should return false when not in maintenance mode', async () => {
      const mockConfig = {
        ...DEFAULT_EDGE_CONFIG,
        maintenanceMode: false,
      };
      
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      });

      const isMaintenanceMode = await service.isMaintenanceMode();
      
      expect(isMaintenanceMode).toBe(false);
    });
  });

  describe('isEmployerRegistrationOpen', () => {
    it('should return true when employer registration is open', async () => {
      const mockConfig = {
        ...DEFAULT_EDGE_CONFIG,
        registrationSettings: {
          ...DEFAULT_EDGE_CONFIG.registrationSettings,
          employerRegistrationOpen: true,
        },
      };
      
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      });

      const isOpen = await service.isEmployerRegistrationOpen();
      
      expect(isOpen).toBe(true);
    });

    it('should return false when employer registration is closed', async () => {
      const mockConfig = {
        ...DEFAULT_EDGE_CONFIG,
        registrationSettings: {
          ...DEFAULT_EDGE_CONFIG.registrationSettings,
          employerRegistrationOpen: false,
        },
      };
      
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      });

      const isOpen = await service.isEmployerRegistrationOpen();
      
      expect(isOpen).toBe(false);
    });
  });

  describe('getAccrualRulesetVersion', () => {
    it('should return accrual ruleset version', async () => {
      const mockConfig = {
        ...DEFAULT_EDGE_CONFIG,
        accrualRuleset: {
          version: '2.0.0',
          effectiveDate: '2025-06-01',
          description: 'Updated ruleset',
          active: true,
        },
      };
      
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      });

      const version = await service.getAccrualRulesetVersion();
      
      expect(version).toBe('2.0.0');
    });
  });

  describe('getRateLimit', () => {
    it('should return rate limit value', async () => {
      const mockConfig = {
        ...DEFAULT_EDGE_CONFIG,
        rateLimits: {
          ...DEFAULT_EDGE_CONFIG.rateLimits,
          loginAttemptsPerHour: 10,
        },
      };
      
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      });

      const rateLimit = await service.getRateLimit('loginAttemptsPerHour');
      
      expect(rateLimit).toBe(10);
    });
  });

  describe('invalidateCache', () => {
    it('should clear cache and force refetch', async () => {
      const mockConfig = { ...DEFAULT_EDGE_CONFIG };
      
      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: async () => mockConfig,
      });

      // First call
      await service.getConfig();
      
      // Invalidate cache
      service.invalidateCache();
      
      // Second call (should refetch)
      await service.getConfig();
      
      // Fetch should be called twice
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
