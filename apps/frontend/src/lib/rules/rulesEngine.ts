/**
 * Flexible Rules Engine for ESTA Tracker
 * Supports versioned rules, multiple policy types, and tenant-specific configurations
 */

import { EmployerSize } from './types';

export interface RuleVersion {
  version: string;
  effectiveDate: Date;
  description: string;
  deprecated?: boolean;
}

export interface AccrualPolicy {
  id: string;
  name: string;
  type: 'accrual' | 'frontload' | 'hybrid';
  version: string;
  employerSize: EmployerSize;
  rules: {
    accrualRate?: number; // hours per hours worked (e.g., 1/30)
    frontloadAmount?: number; // hours granted upfront
    maxPaidHoursPerYear: number;
    maxCarryover: number;
    resetDate?: string; // ISO date or 'anniversary'
    minHoursWorkedPerPeriod?: number;
  };
  conditions?: {
    minEmploymentDays?: number;
    waitingPeriodDays?: number;
    blackoutPeriods?: Array<{ start: string; end: string }>;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tenantId?: string; // If tenant-specific, otherwise null for system default
  };
}

export interface TenantPolicyConfiguration {
  tenantId: string;
  activePolicyId: string;
  policyHistory: Array<{
    policyId: string;
    activatedAt: Date;
    deactivatedAt?: Date;
  }>;
  customizations?: {
    allowNegativeBalance?: boolean;
    requireDocumentationAfterDays?: number;
    autoApprovalUnderHours?: number;
    notifications?: {
      lowBalanceThreshold?: number;
      upcomingExpirationDays?: number;
    };
  };
}

/**
 * Default Michigan ESTA policies
 */
export const DEFAULT_POLICIES: Record<string, AccrualPolicy> = {
  'mi-esta-large-accrual-v1': {
    id: 'mi-esta-large-accrual-v1',
    name: 'Michigan ESTA - Large Employer (Accrual)',
    type: 'accrual',
    version: '1.0.0',
    employerSize: 'large',
    rules: {
      accrualRate: 1 / 30, // 1 hour per 30 hours worked
      maxPaidHoursPerYear: 72,
      maxCarryover: 72,
    },
    metadata: {
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      createdBy: 'system',
    },
  },
  'mi-esta-small-accrual-v1': {
    id: 'mi-esta-small-accrual-v1',
    name: 'Michigan ESTA - Small Employer (Accrual)',
    type: 'accrual',
    version: '1.0.0',
    employerSize: 'small',
    rules: {
      accrualRate: 1 / 30,
      maxPaidHoursPerYear: 40,
      maxCarryover: 40,
    },
    metadata: {
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      createdBy: 'system',
    },
  },
  'mi-esta-large-frontload-v1': {
    id: 'mi-esta-large-frontload-v1',
    name: 'Michigan ESTA - Large Employer (Front-load)',
    type: 'frontload',
    version: '1.0.0',
    employerSize: 'large',
    rules: {
      frontloadAmount: 72,
      maxPaidHoursPerYear: 72,
      maxCarryover: 0, // No carryover with frontload
      resetDate: 'anniversary',
    },
    metadata: {
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      createdBy: 'system',
    },
  },
  'mi-esta-small-frontload-v1': {
    id: 'mi-esta-small-frontload-v1',
    name: 'Michigan ESTA - Small Employer (Front-load)',
    type: 'frontload',
    version: '1.0.0',
    employerSize: 'small',
    rules: {
      frontloadAmount: 40,
      maxPaidHoursPerYear: 40,
      maxCarryover: 0,
      resetDate: 'anniversary',
    },
    metadata: {
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      createdBy: 'system',
    },
  },
};

/**
 * Rules Engine Class
 */
export class RulesEngine {
  private policies: Map<string, AccrualPolicy> = new Map();
  private tenantConfigurations: Map<string, TenantPolicyConfiguration> = new Map();

  constructor() {
    // Load default policies
    Object.values(DEFAULT_POLICIES).forEach((policy) => {
      this.policies.set(policy.id, policy);
    });
  }

  /**
   * Get policy by ID
   */
  getPolicy(policyId: string): AccrualPolicy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * Get active policy for tenant
   */
  getTenantPolicy(tenantId: string): AccrualPolicy | undefined {
    const config = this.tenantConfigurations.get(tenantId);
    if (!config) return undefined;
    return this.policies.get(config.activePolicyId);
  }

  /**
   * Get all policies for employer size
   */
  getPoliciesByEmployerSize(size: EmployerSize): AccrualPolicy[] {
    return Array.from(this.policies.values()).filter(
      (policy) => policy.employerSize === size
    );
  }

  /**
   * Create custom policy for tenant
   */
  createCustomPolicy(
    tenantId: string,
    basePolicyId: string,
    customizations: Partial<AccrualPolicy>,
    createdBy: string
  ): AccrualPolicy {
    const basePolicy = this.policies.get(basePolicyId);
    if (!basePolicy) {
      throw new Error(`Base policy ${basePolicyId} not found`);
    }

    const customPolicy: AccrualPolicy = {
      ...basePolicy,
      ...customizations,
      id: `custom-${tenantId}-${Date.now()}`,
      name: customizations.name || `${basePolicy.name} (Custom)`,
      version: customizations.version || '1.0.0',
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy,
        tenantId,
      },
    };

    this.policies.set(customPolicy.id, customPolicy);
    return customPolicy;
  }

  /**
   * Set active policy for tenant
   */
  setTenantPolicy(
    tenantId: string,
    policyId: string,
    customizations?: TenantPolicyConfiguration['customizations']
  ): void {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy ${policyId} not found`);
    }

    const existingConfig = this.tenantConfigurations.get(tenantId);
    const now = new Date();

    const config: TenantPolicyConfiguration = {
      tenantId,
      activePolicyId: policyId,
      policyHistory: existingConfig?.policyHistory || [],
      customizations,
    };

    // Deactivate previous policy if exists
    if (existingConfig && existingConfig.activePolicyId !== policyId) {
      const lastHistoryIndex = config.policyHistory.length - 1;
      if (lastHistoryIndex >= 0) {
        const lastPolicy = config.policyHistory[lastHistoryIndex];
        if (lastPolicy) {
          lastPolicy.deactivatedAt = now;
        }
      }
    }

    // Add new policy to history
    config.policyHistory.push({
      policyId,
      activatedAt: now,
    });

    this.tenantConfigurations.set(tenantId, config);
  }

  /**
   * Calculate accrual for a given policy
   */
  calculateAccrual(
    policyId: string,
    hoursWorked: number,
    currentYearlyAccrued: number
  ): {
    accrued: number;
    remaining: number;
    capped: boolean;
  } {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy ${policyId} not found`);
    }

    const { rules } = policy;
    const cap = rules.maxPaidHoursPerYear;

    if (policy.type === 'frontload') {
      // Front-load policies grant all hours upfront
      return {
        accrued: rules.frontloadAmount || 0,
        remaining: Math.max(0, cap - currentYearlyAccrued),
        capped: currentYearlyAccrued >= cap,
      };
    }

    // Accrual-based calculation
    const rawAccrued = hoursWorked * (rules.accrualRate || 0);
    const remaining = Math.max(0, cap - currentYearlyAccrued);
    const accrued = Math.min(rawAccrued, remaining);

    return {
      accrued,
      remaining,
      capped: currentYearlyAccrued >= cap || currentYearlyAccrued + rawAccrued > cap,
    };
  }

  /**
   * Validate policy against business rules
   */
  validatePolicy(policy: AccrualPolicy): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!policy.id) {
      errors.push('Policy ID is required');
    }

    if (!policy.name) {
      errors.push('Policy name is required');
    }

    if (!['accrual', 'frontload', 'hybrid'].includes(policy.type)) {
      errors.push('Invalid policy type');
    }

    if (policy.type === 'accrual' && !policy.rules.accrualRate) {
      errors.push('Accrual rate is required for accrual policies');
    }

    if (policy.type === 'frontload' && !policy.rules.frontloadAmount) {
      errors.push('Frontload amount is required for frontload policies');
    }

    if (!policy.rules.maxPaidHoursPerYear || policy.rules.maxPaidHoursPerYear <= 0) {
      errors.push('Max paid hours per year must be greater than 0');
    }

    if (policy.rules.maxCarryover < 0) {
      errors.push('Max carryover cannot be negative');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export policies for storage
   */
  exportPolicies(): AccrualPolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Import policies from storage
   */
  importPolicies(policies: AccrualPolicy[]): void {
    policies.forEach((policy) => {
      this.policies.set(policy.id, policy);
    });
  }
}

// Singleton instance
export const rulesEngine = new RulesEngine();
