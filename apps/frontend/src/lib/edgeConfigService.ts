/**
 * Edge Config Service
 * Provides access to global application settings from Vercel Edge Config
 */

import { EdgeConfigSettings, DEFAULT_EDGE_CONFIG } from '@/types/edgeConfig';

const EDGE_CONFIG_API_ENDPOINT = '/api/edge-config';
const CACHE_DURATION_MS = 60000; // 1 minute cache

interface CachedConfig {
  data: EdgeConfigSettings;
  timestamp: number;
}

class EdgeConfigService {
  private cache: CachedConfig | null = null;
  private fetchPromise: Promise<EdgeConfigSettings> | null = null;

  /**
   * Fetch Edge Config from the API endpoint
   * Uses in-memory cache to reduce API calls
   */
  async getConfig(): Promise<EdgeConfigSettings> {
    // Return cached config if still valid
    if (this.cache && Date.now() - this.cache.timestamp < CACHE_DURATION_MS) {
      return this.cache.data;
    }

    // If a fetch is already in progress, wait for it
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    // Start a new fetch
    this.fetchPromise = this.fetchConfigFromAPI();

    try {
      const config = await this.fetchPromise;
      this.cache = {
        data: config,
        timestamp: Date.now(),
      };
      return config;
    } finally {
      this.fetchPromise = null;
    }
  }

  /**
   * Fetch configuration from the API endpoint
   */
  private async fetchConfigFromAPI(): Promise<EdgeConfigSettings> {
    try {
      const response = await fetch(EDGE_CONFIG_API_ENDPOINT);
      
      if (!response.ok) {
        console.warn('Failed to fetch Edge Config, using defaults:', response.status);
        return DEFAULT_EDGE_CONFIG;
      }

      const config = await response.json();
      return { ...DEFAULT_EDGE_CONFIG, ...config };
    } catch (error) {
      console.error('Error fetching Edge Config:', error);
      return DEFAULT_EDGE_CONFIG;
    }
  }

  /**
   * Get specific feature flag value
   */
  async getFeatureFlag(flag: keyof EdgeConfigSettings['featureFlags']): Promise<boolean> {
    const config = await this.getConfig();
    return config.featureFlags[flag] ?? DEFAULT_EDGE_CONFIG.featureFlags[flag];
  }

  /**
   * Check if application is in maintenance mode
   */
  async isMaintenanceMode(): Promise<boolean> {
    const config = await this.getConfig();
    return config.maintenanceMode ?? false;
  }

  /**
   * Get maintenance mode message
   */
  async getMaintenanceMessage(): Promise<string | undefined> {
    const config = await this.getConfig();
    return config.maintenanceMessage;
  }

  /**
   * Check if employer registration is open
   */
  async isEmployerRegistrationOpen(): Promise<boolean> {
    const config = await this.getConfig();
    return config.registrationSettings.employerRegistrationOpen ?? true;
  }

  /**
   * Check if employee registration is open
   */
  async isEmployeeRegistrationOpen(): Promise<boolean> {
    const config = await this.getConfig();
    return config.registrationSettings.employeeRegistrationOpen ?? true;
  }

  /**
   * Get registration closed message
   */
  async getRegistrationClosedMessage(): Promise<string | undefined> {
    const config = await this.getConfig();
    return config.registrationSettings.closedMessage;
  }

  /**
   * Get current accrual ruleset version
   */
  async getAccrualRulesetVersion(): Promise<string> {
    const config = await this.getConfig();
    return config.accrualRuleset.version;
  }

  /**
   * Get rate limit for a specific operation
   */
  async getRateLimit(operation: keyof EdgeConfigSettings['rateLimits']): Promise<number> {
    const config = await this.getConfig();
    return config.rateLimits[operation] ?? DEFAULT_EDGE_CONFIG.rateLimits[operation];
  }

  /**
   * Invalidate cache and force refresh on next request
   */
  invalidateCache(): void {
    this.cache = null;
  }

  /**
   * Prefetch configuration (useful for critical paths)
   */
  prefetch(): void {
    this.getConfig().catch((error) => {
      console.error('Error prefetching Edge Config:', error);
    });
  }
}

// Export singleton instance
export const edgeConfigService = new EdgeConfigService();

// Export for testing
export { EdgeConfigService };
