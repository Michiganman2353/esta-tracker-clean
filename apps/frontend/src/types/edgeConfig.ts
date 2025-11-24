/**
 * Edge Config Types for Global Settings
 * Defines the structure of settings stored in Vercel Edge Config
 */

/**
 * Feature flags for enabling/disabling application features
 */
export interface FeatureFlags {
  /** Enable/disable doctor note upload requirement for sick time requests */
  doctorNotesEnabled: boolean;
  /** Enable/disable calendar view in the application */
  calendarEnabled: boolean;
  /** Enable/disable the audit log feature */
  auditLogEnabled: boolean;
  /** Enable/disable document upload system */
  documentUploadEnabled: boolean;
  /** Enable/disable push notifications */
  pushNotificationsEnabled: boolean;
}

/**
 * System-wide rate limit configuration
 */
export interface RateLimits {
  /** Maximum login attempts per hour */
  loginAttemptsPerHour: number;
  /** Maximum API requests per minute per user */
  apiRequestsPerMinute: number;
  /** Maximum sick time requests per day per employee */
  sickTimeRequestsPerDay: number;
  /** Maximum document uploads per hour per user */
  documentUploadsPerHour: number;
}

/**
 * Accrual ruleset configuration
 */
export interface AccrualRuleset {
  /** Version identifier for the current ruleset */
  version: string;
  /** Effective date of this ruleset (ISO 8601 format) */
  effectiveDate: string;
  /** Human-readable description of this ruleset version */
  description: string;
  /** Whether this ruleset is currently active */
  active: boolean;
}

/**
 * Registration control settings
 */
export interface RegistrationSettings {
  /** Allow new employer registrations */
  employerRegistrationOpen: boolean;
  /** Allow new employee registrations */
  employeeRegistrationOpen: boolean;
  /** Message to display when registration is closed */
  closedMessage?: string;
}

/**
 * Complete Edge Config structure
 */
export interface EdgeConfigSettings {
  /** Feature flags for the application */
  featureFlags: FeatureFlags;
  /** System-wide rate limits */
  rateLimits: RateLimits;
  /** Current accrual ruleset version */
  accrualRuleset: AccrualRuleset;
  /** Registration control settings */
  registrationSettings: RegistrationSettings;
  /** Maintenance mode flag */
  maintenanceMode: boolean;
  /** Maintenance mode message (displayed when maintenance mode is active) */
  maintenanceMessage?: string;
  /** Last updated timestamp (ISO 8601 format) */
  lastUpdated: string;
}

/**
 * Default Edge Config settings (used as fallback)
 */
export const DEFAULT_EDGE_CONFIG: EdgeConfigSettings = {
  featureFlags: {
    doctorNotesEnabled: true,
    calendarEnabled: true,
    auditLogEnabled: true,
    documentUploadEnabled: true,
    pushNotificationsEnabled: false,
  },
  rateLimits: {
    loginAttemptsPerHour: 5,
    apiRequestsPerMinute: 100,
    sickTimeRequestsPerDay: 10,
    documentUploadsPerHour: 20,
  },
  accrualRuleset: {
    version: '1.0.0',
    effectiveDate: '2025-01-01',
    description: 'Michigan ESTA 2025 - Initial Ruleset',
    active: true,
  },
  registrationSettings: {
    employerRegistrationOpen: true,
    employeeRegistrationOpen: true,
    closedMessage: undefined,
  },
  maintenanceMode: false,
  maintenanceMessage: undefined,
  lastUpdated: new Date().toISOString(),
};
