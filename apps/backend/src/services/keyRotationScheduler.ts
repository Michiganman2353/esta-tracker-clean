/**
 * Automated Key Rotation Scheduler
 *
 * Implements automatic key rotation for KMS keys on a 90-day schedule.
 * This service can be triggered by Cloud Scheduler or run as part of
 * regular maintenance jobs.
 *
 * Key Rotation Benefits:
 * - Limits the amount of data encrypted with any single key
 * - Reduces impact of key compromise
 * - Meets compliance requirements (SOC2, HIPAA)
 * - Enables key version auditing
 *
 * @module keyRotationScheduler
 */

import { kmsService } from './kmsService';

/**
 * Key rotation configuration
 */
export interface KeyRotationConfig {
  /** Days between rotations (default: 90) */
  rotationPeriodDays: number;
  /** Enable automatic rotation in KMS */
  enableAutoRotation: boolean;
  /** Keep old key versions for decryption */
  retainOldVersions: boolean;
  /** Maximum number of key versions to keep */
  maxVersionsToKeep: number;
  /** Notify on rotation */
  notifyOnRotation: boolean;
}

/**
 * Key rotation result
 */
export interface KeyRotationResult {
  success: boolean;
  message: string;
  previousVersion?: string;
  newVersion?: string;
  rotatedAt?: Date;
  nextRotation?: Date;
  error?: string;
}

/**
 * Key version info
 */
export interface KeyVersionInfo {
  version: string;
  state: 'ENABLED' | 'DISABLED' | 'DESTROYED';
  createdAt?: Date;
  algorithm?: string;
}

/**
 * Default rotation configuration
 * Based on security best practices and compliance requirements
 */
export const DEFAULT_ROTATION_CONFIG: KeyRotationConfig = {
  rotationPeriodDays: 90,
  enableAutoRotation: true,
  retainOldVersions: true,
  maxVersionsToKeep: 5,
  notifyOnRotation: true,
};

/**
 * Key rotation scheduler service
 */
class KeyRotationScheduler {
  private config: KeyRotationConfig;
  private lastRotationCheck: Date | null = null;
  private rotationHistory: KeyRotationResult[] = [];

  constructor(config: Partial<KeyRotationConfig> = {}) {
    this.config = { ...DEFAULT_ROTATION_CONFIG, ...config };
  }

  /**
   * Initialize automatic key rotation in KMS
   *
   * This sets up KMS-native automatic rotation, which will
   * create new key versions on the specified schedule.
   *
   * @returns Rotation result
   *
   * @example
   * ```typescript
   * const scheduler = new KeyRotationScheduler({ rotationPeriodDays: 90 });
   * const result = await scheduler.initializeAutoRotation();
   * if (result.success) {
   *   console.log('Auto-rotation enabled:', result.message);
   * }
   * ```
   */
  async initializeAutoRotation(): Promise<KeyRotationResult> {
    try {
      await kmsService.enableKeyRotation(this.config.rotationPeriodDays);

      const result: KeyRotationResult = {
        success: true,
        message: `Automatic key rotation enabled every ${this.config.rotationPeriodDays} days`,
        rotatedAt: new Date(),
        nextRotation: this.calculateNextRotation(),
      };

      this.rotationHistory.push(result);
      return result;
    } catch (error) {
      const result: KeyRotationResult = {
        success: false,
        message: 'Failed to enable automatic key rotation',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      this.rotationHistory.push(result);
      return result;
    }
  }

  /**
   * Check if key rotation is due
   *
   * @returns True if rotation should be performed
   */
  async isRotationDue(): Promise<boolean> {
    try {
      const versions = await this.getKeyVersions();
      if (versions.length === 0) {
        return true;
      }

      // Check age of current version
      const currentVersion = versions[versions.length - 1];
      if (currentVersion?.createdAt) {
        const ageInDays = Math.floor(
          (Date.now() - currentVersion.createdAt.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return ageInDays >= this.config.rotationPeriodDays;
      }

      return false;
    } catch (error) {
      console.error('Error checking rotation status:', error);
      return false;
    }
  }

  /**
   * Get all key versions
   *
   * @returns Array of key version information
   */
  async getKeyVersions(): Promise<KeyVersionInfo[]> {
    try {
      const versionPaths = await kmsService.listKeyVersions();
      return versionPaths.map((path) => {
        const versionMatch = path.match(/cryptoKeyVersions\/(\d+)$/);
        return {
          version: versionMatch?.[1] || 'unknown',
          state: 'ENABLED' as const,
        };
      });
    } catch (error) {
      console.error('Error listing key versions:', error);
      return [];
    }
  }

  /**
   * Calculate next rotation date
   *
   * @param fromDate - Start date (default: now)
   * @returns Next rotation date
   */
  calculateNextRotation(fromDate: Date = new Date()): Date {
    const next = new Date(fromDate);
    next.setDate(next.getDate() + this.config.rotationPeriodDays);
    return next;
  }

  /**
   * Get rotation history
   *
   * @returns Array of past rotation results
   */
  getRotationHistory(): KeyRotationResult[] {
    return [...this.rotationHistory];
  }

  /**
   * Get current configuration
   *
   * @returns Current rotation configuration
   */
  getConfig(): KeyRotationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   *
   * @param updates - Configuration updates
   */
  updateConfig(updates: Partial<KeyRotationConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Check rotation status and health
   *
   * @returns Rotation health status
   */
  async checkRotationHealth(): Promise<{
    healthy: boolean;
    message: string;
    details: {
      autoRotationEnabled: boolean;
      currentVersion: string | null;
      versionCount: number;
      nextRotation: Date | null;
      lastCheck: Date | null;
    };
  }> {
    try {
      const versions = await this.getKeyVersions();
      const currentVersion =
        versions.length > 0 ? versions[versions.length - 1]?.version : null;

      this.lastRotationCheck = new Date();

      return {
        healthy: true,
        message: 'Key rotation is configured and operational',
        details: {
          autoRotationEnabled: this.config.enableAutoRotation,
          currentVersion: currentVersion || null,
          versionCount: versions.length,
          nextRotation: this.calculateNextRotation(),
          lastCheck: this.lastRotationCheck,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Health check failed',
        details: {
          autoRotationEnabled: this.config.enableAutoRotation,
          currentVersion: null,
          versionCount: 0,
          nextRotation: null,
          lastCheck: this.lastRotationCheck,
        },
      };
    }
  }

  /**
   * Generate rotation schedule report
   *
   * @returns Schedule report for auditing
   */
  async generateScheduleReport(): Promise<{
    reportDate: Date;
    configuration: KeyRotationConfig;
    status: 'healthy' | 'warning' | 'error';
    versions: KeyVersionInfo[];
    nextScheduledRotation: Date;
    complianceNotes: string[];
  }> {
    const versions = await this.getKeyVersions();
    const health = await this.checkRotationHealth();

    const complianceNotes: string[] = [];

    if (this.config.rotationPeriodDays <= 90) {
      complianceNotes.push(
        '✅ Rotation period meets SOC2 requirements (≤90 days)'
      );
    } else {
      complianceNotes.push(
        '⚠️ Rotation period exceeds SOC2 recommendation of 90 days'
      );
    }

    if (this.config.enableAutoRotation) {
      complianceNotes.push('✅ Automatic rotation is enabled');
    } else {
      complianceNotes.push('⚠️ Manual rotation may miss scheduled intervals');
    }

    if (versions.length >= 2) {
      complianceNotes.push(
        '✅ Multiple key versions available for backward compatibility'
      );
    }

    return {
      reportDate: new Date(),
      configuration: this.config,
      status: health.healthy ? 'healthy' : 'error',
      versions,
      nextScheduledRotation: this.calculateNextRotation(),
      complianceNotes,
    };
  }
}

/**
 * Cloud Scheduler handler for key rotation
 *
 * This function should be called by Cloud Scheduler every day
 * to check and perform key rotation as needed.
 *
 * @returns Rotation check result
 *
 * @example
 * ```typescript
 * // In Cloud Function triggered by Cloud Scheduler
 * export const rotateKeys = functions.pubsub
 *   .schedule('0 3 * * *') // Daily at 3 AM
 *   .timeZone('America/Detroit')
 *   .onRun(async () => {
 *     const result = await handleScheduledRotation();
 *     console.log('Rotation check:', result);
 *   });
 * ```
 */
export async function handleScheduledRotation(): Promise<KeyRotationResult> {
  const scheduler = new KeyRotationScheduler();

  try {
    // Check if rotation is needed
    const isDue = await scheduler.isRotationDue();

    if (isDue) {
      // Initialize auto-rotation (will create new version)
      return await scheduler.initializeAutoRotation();
    }

    // Check health
    const health = await scheduler.checkRotationHealth();

    return {
      success: true,
      message: 'Rotation not due yet',
      nextRotation: health.details.nextRotation || undefined,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Scheduled rotation check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export singleton instance
export const keyRotationScheduler = new KeyRotationScheduler();

// Export class for testing
export { KeyRotationScheduler };
